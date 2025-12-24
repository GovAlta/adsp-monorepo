from visibility_rules.pipeline_context import (
    CTX_ENUM_MAP,
    CTX_FINAL_RULES,
    CTX_JSONFORMS_RULES,
    CTX_LABEL_TO_ENUM,
    CTX_PARENT_MAP,
    CTX_XDP_ROOT,
)
from visibility_rules.stages.trigger_ast import (
    AtomicCondition,
    CompoundCondition,
    Trigger,
)
from xdp_parser.xdp_utils import compute_full_xdp_path


class JsonFormsEmitter:
    """
    Emit JSONForms rules where:
      - AND => a single schema with merged "properties" (+ "required")
      - OR  => schema.anyOf = [branch1, branch2, ...]
    """

    def process(self, context):
        print("\n[JsonFormsEmitter] Starting...")

        rules = context.get(CTX_FINAL_RULES, []) or []
        enum_maps = context.get(CTX_ENUM_MAP, {}) or {}
        label_to_enum = context.get(CTX_LABEL_TO_ENUM, {}) or {}
        parent_map = context.get(CTX_PARENT_MAP, {}) or {}
        xdp_root = context.get(CTX_XDP_ROOT)

        print(f"[JsonFormsEmitter] IN rules: {len(rules)}")

        emitted: dict[str, dict] = {}
        skipped = 0

        for rule in rules:
            effect = self._map_effect(getattr(rule, "effect", None))

            trig = getattr(rule, "trigger", None)
            if not trig:
                skipped += 1
                continue

            schema = self._trigger_to_schema(trig, enum_maps, label_to_enum)
            if not schema:
                skipped += 1
                continue

            jsonforms_rule = {
                "effect": effect,
                "condition": {
                    "scope": "#",
                    "schema": schema,
                },
            }

            key = self._compute_rule_key(rule, xdp_root, parent_map)
            if not key:
                skipped += 1
                continue

            emitted[key] = {"rule": jsonforms_rule}

        context[CTX_JSONFORMS_RULES] = emitted
        print(f"[JsonFormsEmitter] OUT rules: {len(emitted)} (skipped={skipped})")
        print("[JsonFormsEmitter] Done.\n")
        return context

    # ------------------------------------------------------------------
    # Trigger AST -> JSON Schema
    # ------------------------------------------------------------------

    def _trigger_to_schema(
        self, trigger: Trigger, enum_maps, label_to_enum
    ) -> dict | None:
        node = trigger.node

        if isinstance(node, AtomicCondition):
            return self._atomic_to_schema(node, enum_maps, label_to_enum)

        if isinstance(node, CompoundCondition):
            left = self._trigger_to_schema(node.left, enum_maps, label_to_enum)
            right = self._trigger_to_schema(node.right, enum_maps, label_to_enum)
            if not left or not right:
                return left or right

            op = (node.op or "").upper()

            if op == "AND":
                merged = self._merge_and(left, right)
                return merged or {
                    "allOf": [left, right]
                }  # fallback if merge impossible

            if op == "OR":
                return self._merge_or(left, right)

            raise ValueError(f"Unknown compound op: {node.op!r}")

        raise TypeError(f"Unknown Trigger node type: {type(node)}")

    def _atomic_to_schema(
        self, atom: AtomicCondition, enum_maps, label_to_enum
    ) -> dict | None:
        drv = (atom.driver or "").split(".")[-1].strip()
        if not drv:
            return None

        val = atom.value
        if val is None:
            return None

        mapped = self._map_value(drv, val, enum_maps, label_to_enum)

        op = (atom.op or "").strip()
        if op in ("==", "="):
            prop_schema = {"const": mapped}
        elif op in ("!=", "<>"):
            prop_schema = {"not": {"const": mapped}}
        else:
            # If you later want >, <, etc, add them here.
            # For now, fail loudly so weirdness doesn’t silently ship.
            raise ValueError(f"Unsupported atomic op for JSONForms: {op!r}")

        return {
            "properties": {drv: prop_schema},
            "required": [drv],
        }

    def _merge_and(self, left: dict, right: dict) -> dict | None:
        """
        Merge two AND branches into a single {properties, required} object
        when both are "simple" schemas.
        """
        if not self._is_simple(left) or not self._is_simple(right):
            return None

        lp = dict(left.get("properties", {}))
        rp = right.get("properties", {})

        # If same property appears twice with different constraints, don't guess.
        for k, v in rp.items():
            if k in lp and lp[k] != v:
                return None
            lp[k] = v

        req = []
        for r in left.get("required", []):
            if r not in req:
                req.append(r)
        for r in right.get("required", []):
            if r not in req:
                req.append(r)

        out = {"properties": lp}
        if req:
            out["required"] = req
        return out

    def _merge_or(self, left: dict, right: dict) -> dict:
        """
        OR => anyOf. Flatten nested anyOf to keep output tidy.
        Then try to collapse anyOf of the form:
            (X == a) OR (X == b) OR ...
        into:
            X in [a,b,...]  (enum)
        """
        branches: list[dict] = []

        def add(branch: dict):
            if isinstance(branch, dict) and "anyOf" in branch and len(branch) == 1:
                for b in branch.get("anyOf") or []:
                    branches.append(b)
            else:
                branches.append(branch)

        add(left)
        add(right)

        # Try to collapse simple OR chains into enum
        collapsed = self._collapse_anyof_to_enum(branches)
        if collapsed is not None:
            return collapsed

        return {"anyOf": branches}

    def _collapse_anyof_to_enum(self, branches: list[dict]) -> dict | None:
        """
        Collapse:
        anyOf: [
            {properties:{X:{const:a}}, required:[X]},
            {properties:{X:{const:b}}, required:[X]},
            ...
        ]
        into:
        {properties:{X:{enum:[a,b,...]}}, required:[X]}

        Returns the collapsed SIMPLE schema, or None if not applicable.
        """
        if not branches or not isinstance(branches, list):
            return None

        driver = None
        values = []

        for br in branches:
            if not self._is_simple(br):
                return None

            props = br.get("properties") or {}
            req = br.get("required") or []

            if len(props) != 1 or len(req) != 1:
                return None

            ((drv, drv_schema),) = props.items()

            if req[0] != drv:
                return None

            if not isinstance(drv_schema, dict):
                return None

            # Accept either {"const": v} or {"enum": [v1,v2,...]} — nothing else.
            keys = set(drv_schema.keys())
            if keys == {"const"}:
                vals = [drv_schema["const"]]
            elif keys == {"enum"} and isinstance(drv_schema.get("enum"), list):
                vals = list(drv_schema["enum"])
                if not vals:
                    return None
            else:
                return None

            if driver is None:
                driver = drv
            elif drv != driver:
                return None

            values.extend(vals)

        if driver is None or not values:
            return None

        # de-dupe, keep order
        uniq = []
        seen = set()
        for v in values:
            key = ("s", v) if isinstance(v, str) else ("o", repr(v))
            if key in seen:
                continue
            seen.add(key)
            uniq.append(v)

        if len(uniq) == 1:
            # technically could just return the one branch, but this is fine & clean
            return {"properties": {driver: {"const": uniq[0]}}, "required": [driver]}

        return {"properties": {driver: {"enum": uniq}}, "required": [driver]}

    def _is_simple(self, schema: dict) -> bool:
        if not isinstance(schema, dict):
            return False
        allowed = {"properties", "required"}
        if any(k not in allowed for k in schema.keys()):
            return False
        if "properties" not in schema:
            return False
        return True

    # ------------------------------------------------------------------
    # Value mapping
    # ------------------------------------------------------------------

    def _map_value(self, driver: str, value, enum_maps, label_to_enum):
        """
        Convert "raw" values into what JSONForms should compare against.
        Priority:
          1) If value is a known label in label_to_enum, convert to saved const (then to label if enum_map provides it)
          2) If driver has enum_map and value is a key, map it to label
          3) If value is already a string label, keep it
        """
        s = str(value).strip()

        # Special token you introduced earlier
        if s == "<blank>":
            return ""  # treat blank selection as empty string in JSON data

        # 1) label_to_enum mapping
        if s in label_to_enum:
            drv2, const_val = label_to_enum[s]
            mapping = enum_maps.get(drv2) or {}
            return mapping.get(str(const_val), str(const_val))

        # 2) enum map by driver
        mapping = enum_maps.get(driver)
        if mapping:
            # If the raw value is numeric code, map it.
            key = self._strip_quotes(s)
            if key in mapping:
                return mapping[key]
            # If it’s already a label, leave it alone.
            return s

        return s

    def _strip_quotes(self, s: str) -> str:
        s = (s or "").strip()
        if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
            return s[1:-1]
        return s

    # ------------------------------------------------------------------
    # Effect mapping + key computation
    # ------------------------------------------------------------------

    def _map_effect(self, raw_effect: str | None) -> str:
        if not raw_effect:
            return "SHOW"
        eff = raw_effect.upper()
        if eff in {"SHOW", "HIDE", "DISABLE", "ENABLE"}:
            return eff
        if eff in {"VISIBLE", "VIS"}:
            return "SHOW"
        if eff in {"INVISIBLE", "HIDDEN"}:
            return "HIDE"
        return eff

    def _compute_rule_key(self, rule, xdp_root, parent_map):
        target = getattr(rule, "target", None) or ""
        if "." in target:
            return target

        if xdp_root is not None:
            node = self._find_node_by_name(target, xdp_root)
            if node is not None:
                try:
                    return compute_full_xdp_path(node, parent_map)
                except Exception as e:
                    print(f"  [WARN] compute_full_xdp_path failed for '{target}': {e}")

        return target or None

    def _find_node_by_name(self, name: str, xdp_root):
        for el in xdp_root.iter():
            if el.attrib.get("name") == name:
                return el
        return None
