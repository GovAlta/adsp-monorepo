from typing import Optional

from visibility_rules.pipeline_context import (
    CTX_ENUM_MAP,
    CTX_JSONFORMS_RULES,
    CTX_LABEL_TO_ENUM,
    CTX_PARENT_MAP,
    CTX_XDP_ROOT,
    PipelineContext,
)
from visibility_rules.stages.context_types import (
    JsonFormsRule,
    JsonFormsRuleEntry,
    JsonSchemaElement,
    JsonValue,
    SimpleSchema,
)
from visibility_rules.stages.trigger_ast import (
    AtomicCondition,
    CompoundCondition,
    Trigger,
)
from xdp_parser.xdp_utils import compute_full_xdp_path

debug = False


class JsonFormsEmitter:
    """
    Emit JSONForms rules where:
      - AND => a single schema with merged "properties" (+ "required")
      - OR  => schema.anyOf = [branch1, branch2, ...]
    """

    def process(self, context: PipelineContext) -> PipelineContext:
        if debug:
            print("\n[JsonFormsEmitter] Starting...")

        rules = context.get_final_rules()
        enum_maps = context.get(CTX_ENUM_MAP, {}) or {}
        label_to_enum = context.get(CTX_LABEL_TO_ENUM, {}) or {}
        parent_map = context.get(CTX_PARENT_MAP, {}) or {}
        xdp_root = context.get(CTX_XDP_ROOT)

        if debug:
            print(f"[JsonFormsEmitter] IN rules: {len(rules)}")

        emitted: dict[str, list[JsonFormsRule]] = {}
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

            jsonforms_rule: JsonFormsRule = {
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

            if debug:
                print(
                    f"[Emitter] target={getattr(rule,'target',None)!r}  effect={effect}  key={key}"
                )

            emitted.setdefault(key, []).append(jsonforms_rule)
            if debug:
                print(f"Rule for {key} is:")
                print(f"    {jsonforms_rule}\n")

        final_emitted: dict[str, JsonFormsRuleEntry] = {}
        for key, rule_list in emitted.items():
            merged = self.merge_rules_for_target(rule_list)
            final_emitted[key] = {"rule": merged}

        context[CTX_JSONFORMS_RULES] = final_emitted
        if debug:
            print(f"[JsonFormsEmitter] OUT rules: {len(final_emitted)}")
            print(f"    skipped={skipped})")
            print("[JsonFormsEmitter] Done.\n")
        return context

    # ------------------------------------------------------------------
    # Trigger AST -> JSON Schema
    # ------------------------------------------------------------------

    def _trigger_to_schema(
        self, trigger: Trigger, enum_maps, label_to_enum
    ) -> Optional[JsonSchemaElement]:
        node = trigger.node

        if isinstance(node, AtomicCondition):
            return self._atomic_to_schema(node, enum_maps, label_to_enum)

        if isinstance(node, CompoundCondition):
            left: Optional[JsonSchemaElement] = self._trigger_to_schema(
                node.left, enum_maps, label_to_enum
            )
            right: Optional[JsonSchemaElement] = self._trigger_to_schema(
                node.right, enum_maps, label_to_enum
            )
            if not left or not right:
                return left or right

            op = (node.op or "").upper()

            if op == "AND":
                merged = self._merge_and(left, right)
                if isinstance(merged, dict):
                    return merged
                all_of: list[JsonValue] = [left, right]
                return {"allOf": all_of}

            if op == "OR":
                return self._merge_or(left, right)

            raise ValueError(f"Unknown compound op: {node.op!r}")

        raise TypeError(f"Unknown Trigger node type: {type(node)}")

    def _atomic_to_schema(
        self, atom: AtomicCondition, enum_maps, label_to_enum
    ) -> Optional[JsonSchemaElement]:
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

    def _merge_and(
        self, left: JsonSchemaElement, right: JsonSchemaElement
    ) -> Optional[JsonValue]:
        if not self._is_simple(left) or not self._is_simple(right):
            return None

        # --- Narrow and normalize properties ---
        left_props_val = left.get("properties")
        right_props_val = right.get("properties")
        if not isinstance(left_props_val, dict) or not isinstance(
            right_props_val, dict
        ):
            return None

        lp: dict[str, JsonValue] = {}
        for k, v in left_props_val.items():
            if isinstance(k, str) and isinstance(v, dict):
                lp[k] = v
            else:
                return None

        rp: dict[str, JsonValue] = {}
        for k, v in right_props_val.items():
            if isinstance(k, str) and isinstance(v, dict):
                rp[k] = v
            else:
                return None

        # If same property appears twice with different constraints, don't guess.
        for k, v in rp.items():
            if k in lp and lp[k] != v:
                return None
            lp[k] = v

        # --- Narrow and normalize required ---
        req: list[str] = []

        left_req_val = left.get("required", [])
        if left_req_val is not None and not isinstance(left_req_val, list):
            return None
        for r in left_req_val or []:
            if not isinstance(r, str):
                return None
            if r not in req:
                req.append(r)

        right_req_val = right.get("required", [])
        if right_req_val is not None and not isinstance(right_req_val, list):
            return None
        for r in right_req_val or []:
            if not isinstance(r, str):
                return None
            if r not in req:
                req.append(r)

        out: JsonSchemaElement = {"properties": lp}
        if req:
            out["required"] = req
        return out

    def _merge_or(
        self, left: JsonSchemaElement, right: JsonSchemaElement
    ) -> JsonSchemaElement:
        """
        OR => anyOf. Flatten nested anyOf to keep output tidy.
        Then try to collapse anyOf of the form:
            (X == a) OR (X == b) OR ...
        into:
            X in [a,b,...]  (enum)
        """
        branches: list[JsonValue] = []

        def add(branch: JsonSchemaElement) -> None:
            anyof = branch.get("anyOf")
            # Flatten only the canonical wrapper: {"anyOf": [...]}
            if isinstance(anyof, list) and len(branch) == 1:
                for b in anyof:
                    # Only keep schema-object branches
                    if isinstance(b, dict):
                        branches.append(b)
                return
            branches.append(branch)

        add(left)
        add(right)

        # Narrowing list for enum collapsing: only dicts
        schema_branches: list[JsonSchemaElement] = [
            b for b in branches if isinstance(b, dict)
        ]

        if debug:
            print("OR branches:")
            for b in branches:
                print(b)

        # Try to collapse simple OR chains into enum
        collapsed = self._collapse_anyof_to_enum(schema_branches)

        if debug:
            print("Collapsed:", collapsed)

        if collapsed is not None:
            return collapsed

        return {"anyOf": branches}

    def _collapse_anyof_to_enum(
        self, branches: list[JsonSchemaElement]
    ) -> Optional[JsonSchemaElement]:
        """
        Collapse:
        anyOf: [
            {properties:{X:{const:a}}, required:[X]},
            {properties:{X:{const:b}}, required:[X]},
            ...
        ]
        into:
        {properties:{X:{enum:[a,b,...]}}, required:[X]}
        """
        if not branches:
            return None

        driver: str | None = None
        values: list[JsonValue] = []

        for br in branches:
            if not self._is_simple(br):
                return None

            props_val = br.get("properties")
            req_val = br.get("required")

            if not isinstance(props_val, dict):
                return None
            if not isinstance(req_val, list):
                return None

            # `required` must be a list[str] for our pattern
            req_strs: list[str] = []
            for item in req_val:
                if not isinstance(item, str):
                    return None
                req_strs.append(item)

            # Need exactly one property and exactly one required entry
            if len(props_val) != 1 or len(req_strs) != 1:
                return None

            ((drv, drv_schema),) = props_val.items()

            if req_strs[0] != drv:
                return None

            if not isinstance(drv_schema, dict):
                return None

            # Accept either {"const": v} or {"enum": [v1,v2,...]} — nothing else.
            keys = set(drv_schema.keys())
            if keys == {"const"}:
                vals: list[JsonValue] = [drv_schema["const"]]
            elif keys == {"enum"}:
                enum_val = drv_schema.get("enum")
                if not isinstance(enum_val, list) or not enum_val:
                    return None
                vals = list(enum_val)
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
        uniq: list[JsonValue] = []
        seen: set[tuple[str, str]] = set()
        for v in values:
            key = ("s", v) if isinstance(v, str) else ("o", repr(v))
            if key in seen:
                continue
            seen.add(key)
            uniq.append(v)

        if len(uniq) == 1:
            return {"properties": {driver: {"const": uniq[0]}}, "required": [driver]}

        return {"properties": {driver: {"enum": uniq}}, "required": [driver]}

    def _is_simple(self, schema: JsonSchemaElement) -> bool:
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

        # Special token
        if s == "<blank>":
            return ""

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

    def merge_rules_for_target(self, rules: list[dict]) -> dict:
        """
        Merge multiple JSONForms rule dicts for ONE target into a single rule.

        Policy:
        - Prefer HIDE when both HIDE and SHOW exist.
        - Merge same-effect schemas using OR semantics (anyOf).
        - Flatten nested anyOf.
        - Remove duplicates.
        """

        if not rules:
            return {
                "effect": "SHOW",
                "condition": {"scope": "#", "schema": {}},
            }

        grouped = self._group_rules_by_effect(rules)

        if "HIDE" in grouped:
            merged_schema = self._merge_schemas_or(grouped["HIDE"])
            return {
                "effect": "HIDE",
                "condition": {"scope": "#", "schema": merged_schema},
            }

        if "SHOW" in grouped:
            merged_schema = self._merge_schemas_or(grouped["SHOW"])
            return {
                "effect": "SHOW",
                "condition": {"scope": "#", "schema": merged_schema},
            }

        # fallback for DISABLE / ENABLE etc.
        effect = next(iter(grouped.keys()))
        merged_schema = self._merge_schemas_or(grouped[effect])
        return {
            "effect": effect,
            "condition": {"scope": "#", "schema": merged_schema},
        }

    def _group_rules_by_effect(
        self, rules: list[JsonFormsRule]
    ) -> dict[str, list[JsonSchemaElement]]:
        grouped: dict[str, list[JsonSchemaElement]] = {}

        for r in rules:
            effect_val = r.get("effect")
            effect = effect_val.upper() if isinstance(effect_val, str) else "SHOW"
            cond = r.get("condition")
            if not isinstance(cond, dict):
                continue

            schema = cond.get("schema")
            if not isinstance(schema, dict) or not schema:
                continue

            grouped.setdefault(effect, []).append(schema)

        return grouped

    def _merge_schemas_or(self, schemas: list[JsonSchemaElement]) -> JsonSchemaElement:
        flat = self._flatten_schema_list(schemas)
        unique = self._dedupe_schemas(flat)

        if not unique:
            return {}

        if len(unique) == 1:
            return unique[0]

        any_of: list[JsonValue] = list(unique)
        return {"anyOf": any_of}

    def _flatten_schema_list(
        self, schemas: list[JsonSchemaElement]
    ) -> list[JsonSchemaElement]:
        flat: list[JsonSchemaElement] = []

        for schema in schemas:
            flat.extend(self._flatten_schema(schema))

        return flat

    def _flatten_schema(self, schema: JsonValue) -> list[JsonSchemaElement]:
        if (
            isinstance(schema, dict)
            and "anyOf" in schema
            and len(schema) == 1
            and isinstance(schema["anyOf"], list)
        ):
            result: list[JsonSchemaElement] = []
            for branch in schema["anyOf"]:
                result.extend(self._flatten_schema(branch))
            return result

        if isinstance(schema, dict):
            return [schema]
        return []

    def _dedupe_schemas(
        self, schemas: list[JsonSchemaElement]
    ) -> list[JsonSchemaElement]:
        unique: list[JsonSchemaElement] = []
        seen: set[str] = set()

        for schema in schemas:
            key = repr(schema)
            if key in seen:
                continue
            seen.add(key)
            unique.append(schema)

        return unique
