from visibility_rules.pipeline_context import (
    CTX_ENUM_MAP,
    CTX_FINAL_RULES,
    CTX_JSONFORMS_RULES,
    CTX_LABEL_TO_ENUM,
    CTX_PARENT_MAP,
    CTX_XDP_ROOT,
)
from xdp_parser.xdp_utils import compute_full_xdp_path


class JsonFormsEmitter:
    """
    Converts normalized visibility rules into JSONForms-compatible
    rule definitions.

    Hybrid goals:
    - Use VisibilityRule.conditions as source of truth
    - Respect rule.logic (AND vs OR)
    - Map numeric enum values → labels via enum_maps
    - Emit clean schemas:
        AND → properties + required
        OR  → schema.anyOf = [ {properties, required}, ... ]
    - Generate robust keys for attachment:
        * Prefer target if already qualified
        * Otherwise compute XDP path from XML
        * Fallback to the raw target
    """

    def process(self, context):
        print("\n[JsonFormsEmitter] Starting...")

        normalized_rules = context.get(CTX_FINAL_RULES, [])
        enum_maps = context.get(CTX_ENUM_MAP, {}) or {}
        label_to_enum = context.get(CTX_LABEL_TO_ENUM, {}) or {}
        parent_map = context.get(CTX_PARENT_MAP, {}) or {}
        xdp_root = context.get(CTX_XDP_ROOT)

        print(f"[JsonFormsEmitter] IN merged rules: {len(normalized_rules)}")

        emitted: dict[str, dict] = {}

        unmapped_values = 0
        skipped_empty = 0

        for rule in normalized_rules:
            if not rule.conditions:
                print(f"  [SKIP] Rule '{rule.target}' has no conditions.")
                continue

            effect = self._map_effect(rule.effect)

            logic = (rule.logic or "AND").upper()

            if logic == "OR":
                schema, scope = self._build_or_schema(rule, enum_maps, label_to_enum)
            else:
                schema, scope = self._build_and_schema(rule, enum_maps, label_to_enum)

            if schema is None:
                skipped_empty += 1
                continue

            jsonforms_rule = {
                "effect": effect,
                "condition": {
                    "scope": scope,
                    "schema": schema,
                },
            }

            key = self._compute_rule_key(rule, xdp_root, parent_map)
            if key is None:
                print(
                    f"  [WARN] Could not compute key for target '{rule.target}', skipping."
                )
                continue

            # If multiple rules land on the same target, keep the last one for now.
            # (If you want multiple rules per target, this is where we could
            #  collect into a list and later merge.)
            emitted[key] = {"rule": jsonforms_rule}

        context[CTX_JSONFORMS_RULES] = emitted

        print(f"[JsonFormsEmitter] OUT jsonforms rules: {len(emitted)}")
        print(f"[JsonFormsEmitter]   skipped_empty: {skipped_empty}")
        print("[JsonFormsEmitter] Done.\n")

        return context

    # ------------------------------------------------------------------
    # Effect mapping
    # ------------------------------------------------------------------
    def _map_effect(self, raw_effect: str | None) -> str:
        if not raw_effect:
            return "SHOW"

        eff = raw_effect.upper()

        if eff in {"SHOW", "HIDE", "DISABLE", "ENABLE"}:
            return eff

        # Common XDP-style wordings
        if eff in {"VISIBLE", "VIS"}:
            return "SHOW"
        if eff in {"INVISIBLE", "HIDDEN"}:
            return "HIDE"

        return eff

    # ------------------------------------------------------------------
    # Schema builders
    # ------------------------------------------------------------------
    def _build_and_schema(self, rule, enum_maps, label_to_enum):
        """
        Build a single {properties, required} schema combining all conditions
        with logical AND.
        """
        properties: dict[str, dict] = {}
        required: list[str] = []

        for cond in rule.conditions:
            sub = self._condition_to_subschema(cond, enum_maps, label_to_enum)
            if not sub:
                continue

            sub_props = sub.get("properties", {})
            sub_req = sub.get("required", [])

            for drv, drv_schema in sub_props.items():
                if drv in properties:
                    # If the same driver appears multiple times, we can
                    # eventually merge const/enum – for now, last wins.
                    # (If this becomes a problem, we can add merging logic here.)
                    pass
                properties[drv] = drv_schema

            for drv in sub_req:
                if drv not in required:
                    required.append(drv)

        if not properties:
            return None, None

        return {"properties": properties, "required": required}, "#"

    def _build_or_schema(self, rule, enum_maps, label_to_enum):
        """
        Build a schema with anyOf = [ {properties, required}, ... ]
        where each branch represents one of the conditions.
        """
        any_of: list[dict] = []

        for cond in rule.conditions:
            sub = self._condition_to_subschema(cond, enum_maps, label_to_enum)
            if not sub:
                continue
            any_of.append(sub)

        if not any_of:
            return None, None

        return {"anyOf": any_of}, "#"

    # ------------------------------------------------------------------
    # Condition → {properties, required} helper
    # ------------------------------------------------------------------
    def _condition_to_subschema(self, cond, enum_maps, label_to_enum):
        """
        Turn a single VisibilityCondition into:

            {
               "properties": {
                 "<driver>": { "const": <mapped_value> }
               },
               "required": ["<driver>"]
            }
        """

        if not getattr(cond, "driver", None):
            return None

        raw_value = getattr(cond, "value", None)
        if raw_value is None:
            return None

        driver_full = cond.driver
        driver_key = driver_full.split(".")[-1]

        mapped_value = self._resolve_checkbox_or_enum(cond, enum_maps, label_to_enum)

        if mapped_value is None:
            return None

        return {
            "properties": {
                driver_key: {"const": mapped_value},
            },
            "required": [driver_key],
        }

    # ------------------------------------------------------------------
    # Enum / checkbox value mapping
    # ------------------------------------------------------------------
    def _resolve_checkbox_or_enum(self, cond, enum_maps, label_to_enum):
        """
        Try to map condition value into a human label using:
        1. label_to_enum (for checkbox label → (driver,const))
        2. enum_maps[driver_key][const]
        3. fallback: raw value
        """
        raw = str(cond.value).strip()
        raw_lc = raw.lower()

        # 1) direct label hit
        if raw in label_to_enum:
            driver, const_val = label_to_enum[raw]
            enum_map = enum_maps.get(driver, {})
            return enum_map.get(str(const_val), const_val)

        # 2) fuzzy label hit
        for label, (driver, const_val) in label_to_enum.items():
            lab_lc = str(label).strip().lower()
            if raw_lc == lab_lc or raw_lc in lab_lc or lab_lc in raw_lc:
                enum_map = enum_maps.get(driver, {})
                return enum_map.get(str(const_val), const_val)

        # 3) enum mapping by driver suffix
        driver_key = cond.driver.split(".")[-1]
        mapping = enum_maps.get(driver_key)
        if mapping:
            return mapping.get(str(raw), raw)

        # 4) raw value as fallback
        return raw

    # ------------------------------------------------------------------
    # Rule key computation
    # ------------------------------------------------------------------
    def _compute_rule_key(self, rule, xdp_root, parent_map):
        """
        Compute the key that will be used to look up rules during UI schema emission.

        Strategy:
        - If rule.target already looks qualified (has dots), use it as-is.
        - Else, if we can find the XDP node by name, use compute_full_xdp_path.
        - Else, fall back to raw rule.target.
        """
        target = rule.target or ""

        # Rule targets coming from upstream often already look like
        # "Section3Default", "Section4.Regular.cboDecalPackage", etc.
        if "." in target:
            return target

        if xdp_root is not None:
            node = self._find_node_by_name(target, xdp_root)
            if node is not None:
                try:
                    return compute_full_xdp_path(node, parent_map)
                except Exception as e:
                    print(f"  [WARN] compute_full_xdp_path failed for '{target}': {e}")

        # Fallback: raw target
        return target or None

    def _find_node_by_name(self, name: str, xdp_root):
        """Find the first element in the tree whose name attribute matches the given name."""
        for el in xdp_root.iter():
            if el.attrib.get("name") == name:
                return el
        return None
