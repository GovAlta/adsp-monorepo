from constants import (
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

    Features:
    - Converts numeric constants into labels via enum_maps
    - Builds clean schema/scope (no redundant 'properties')
    - Supports multiple rules per target (no overwriting)
    - Removes duplicate or redundant rule entries
    - Emits detailed debug output
    """

    def process(self, context):
        print("\n[JsonFormsEmitter] Starting...")

        normalized_rules = context.get(CTX_FINAL_RULES, [])
        enum_maps = context.get(CTX_ENUM_MAP, {})
        label_to_enum = context.get(CTX_LABEL_TO_ENUM, {})
        parent_map = context.get(CTX_PARENT_MAP, {})
        xdp_root = context.get(CTX_XDP_ROOT, None)

        print(f"[JsonFormsEmitter] IN rules: {len(normalized_rules)}")

        emitted = {}

        # --- Diagnostic counters ---
        unmapped = 0
        empty_props = 0

        for rule in normalized_rules:
            driver, const_value = self._resolve_target_to_enum(
                rule.target, label_to_enum
            )

            # Case 1: Target enum resolved cleanly
            if driver and const_value is not None:
                mapped_value = self.resolve_enum_value(driver, const_value, enum_maps)

                if mapped_value is None:
                    unmapped += 1
                    continue

                schema = {"const": mapped_value}
                scope = f"#/properties/{driver}"

            # Case 2: Exactly one condition
            elif len(rule.conditions) == 1:
                cond = rule.conditions[0]
                driver = cond.driver

                mapped = self.resolve_enum_value(driver, cond.value, enum_maps)
                if mapped is None:
                    unmapped += 1
                    continue

                schema = {"const": mapped}
                scope = f"#/properties/{driver}"

            # Case 3: Multi-condition rules
            else:
                # print(f"[DEBUG] multi-cond rule.target={rule.target}")
                # for cond in rule.conditions:
                #     print(
                #         f"    [DEBUG] cond.driver={cond.driver}, cond.value={cond.value}"
                #     )
                # print(
                #     f"    [DEBUG] label_to_enum keys={list(label_to_enum.keys())[:8]}..."
                # )
                # print(f"    [DEBUG] enum_maps keys={list(enum_maps.keys())[:8]}...")

                props = {}
                for cond in rule.conditions:
                    ...

                for cond in rule.conditions:
                    # Skip reflexive conditions
                    if cond.driver.split(".")[-1] == rule.target.split(".")[-1]:
                        continue

                    driver_key = cond.driver.split(".")[-1]
                    mapped_value = self._resolve_checkbox_or_enum(
                        cond, enum_maps, label_to_enum
                    )

                    if mapped_value is None:
                        unmapped += 1
                        continue

                    props[driver_key] = {"const": mapped_value}

                if not props:
                    empty_props += 1
                    continue

                schema = {"properties": props}
                scope = "#/properties"

            # Now construct final rule entry
            rule_entry = {
                "effect": "SHOW" if rule.effect.upper() == "VISIBLE" else "HIDE",
                "condition": {"scope": scope, "schema": schema},
            }

            # Compute fully-qualified key
            qualified_target = compute_full_xdp_path(
                self._find_node_by_name(rule.target, xdp_root), parent_map
            )
            emitted.setdefault(qualified_target, {"rules": []})["rules"].append(
                rule_entry
            )

        # --- Emit diagnostics ---
        print(f"[JsonFormsEmitter]   unmapped rules: {unmapped}")
        print(f"[JsonFormsEmitter]   empty_props rules: {empty_props}")

        # Merge rule lists into single rules
        for key, entry in list(emitted.items()):
            merged = self._merge_rules_to_single(entry.get("rules", []))
            if merged:
                entry["rule"] = merged
            entry.pop("rules", None)

        context[CTX_JSONFORMS_RULES] = emitted

        print(f"[JsonFormsEmitter] OUT jsonforms rules: {len(emitted)}")
        print("[JsonFormsEmitter] Done.\n")

        return context

    def _find_node_by_name(self, name: str, xdp_root):
        """Find the first element in the tree whose name attribute matches the given name."""
        for el in xdp_root.iter():
            if el.attrib.get("name") == name:
                return el
        return None

    def resolve_enum_value(self, driver: str, raw_value: str | int, enum_maps):
        """
        Convert numeric constants (e.g. '1', '2') into enum labels
        using the provided enum_maps from the extractor.
        Tries both full and partial driver names.
        """
        if raw_value is None:
            return None

        value_key = str(raw_value).strip()
        enum_map = enum_maps.get(driver)
        if enum_map and value_key in enum_map:
            mapped = enum_map[value_key]
            return mapped

        if "." in driver:
            last = driver.split(".")[-1]
            enum_map = enum_maps.get(last)
            if enum_map and value_key in enum_map:
                mapped = enum_map[value_key]
                return mapped

        return raw_value

    def _map_enum_value(self, driver: str, raw_value: str, enum_maps: dict) -> str:
        maps = enum_maps or {}
        key = driver
        mapping = maps.get(key)

        if mapping is None and "." in driver:
            suffix = driver.split(".")[-1]
            mapping = maps.get(suffix)

        return mapping.get(str(raw_value), raw_value) if mapping else raw_value

    def _resolve_target_to_enum(
        self, target: str, label_to_enum: dict[str, tuple[str, str]]
    ):
        """Return (driver, const_value) if the target label matches a known enum label."""
        for label, (driver, const_value) in label_to_enum.items():
            if target.strip().lower() in label.strip().lower():
                return driver, const_value
        return None, None

    def _merge_rules_to_single(self, rule_list: list[dict]) -> dict | None:
        """
        Merge multiple raw rules into a single JSONForms-compliant rule object *without* using anyOf.
        Strategy:
        - Prefer a single EFFECT per target. If any SHOW exists, prefer SHOW; otherwise HIDE.
        - Combine all conditions for the preferred effect into a single schema with:
            scope: "#"
            schema: { "properties": { <driver>: {const|enum: ...}, ... }, "required": [drivers...] }
        - Drivers that appear multiple times get merged using `enum` of all their values.
        - If we encounter an unsupported schema shape, fall back to returning the first rule of the preferred effect.
        """
        if not rule_list:
            return None

        # 1) Choose preferred effect (SHOW wins if present)
        effects = [r.get("effect") for r in rule_list]
        preferred_effect = "SHOW" if "SHOW" in effects else (effects[0] or "SHOW")

        # 2) Collect all rules matching the preferred effect
        selected = [r for r in rule_list if r.get("effect") == preferred_effect]
        if not selected:
            selected = [rule_list[0]]

        # Helper to add a (driver -> value) to the accumulator
        def add_prop(acc: dict[str, list], driver: str, value):
            if driver not in acc:
                acc[driver] = []
            if value not in acc[driver]:
                acc[driver].append(value)

        prop_values: dict[str, list] = {}

        # 3) Normalize/merge each selected rule's schema into prop_values
        for r in selected:
            cond = r.get("condition", {})
            schema = cond.get("schema", {})
            scope = cond.get("scope", "") or ""

            # Case A: single-property rule like scope "#/properties/<driver>", schema {const: X}
            if (
                scope.startswith("#/properties/")
                and "const" in schema
                and isinstance(schema, dict)
            ):
                driver = scope.split("#/properties/")[-1]
                add_prop(prop_values, driver, schema.get("const"))
                continue

            # Case B: multi-property rule like schema {properties: {...}}
            if (
                isinstance(schema, dict)
                and "properties" in schema
                and isinstance(schema["properties"], dict)
            ):
                props = schema["properties"]
                unsupported = False
                for driver, drv_schema in props.items():
                    if not isinstance(drv_schema, dict):
                        unsupported = True
                        break
                    if "const" in drv_schema:
                        add_prop(prop_values, driver, drv_schema["const"])
                    elif "enum" in drv_schema and isinstance(drv_schema["enum"], list):
                        for v in drv_schema["enum"]:
                            add_prop(prop_values, driver, v)
                    else:
                        # Complex shapes (e.g., {"not": {...}}) are not merged here
                        unsupported = True
                        break
                if unsupported:
                    # Fallback to returning the first selected rule unchanged
                    return selected[0]
                continue

            # Unknown shape → fallback
            return selected[0]

        # 4) Build merged properties + required
        merged_props: dict[str, dict] = {}
        required: list[str] = []
        for driver, vals in prop_values.items():
            if not vals:
                continue
            required.append(driver)
            if len(vals) == 1:
                merged_props[driver] = {"const": vals[0]}
            else:
                merged_props[driver] = {"enum": vals}

        if not merged_props:
            # Nothing to merge; return first selected rule
            return selected[0]

        # 5) Return the single merged rule
        return {
            "effect": preferred_effect,
            "condition": {
                "scope": "#",
                "schema": {
                    "properties": merged_props,
                    "required": required,
                },
            },
        }

    def _resolve_checkbox_or_enum(self, cond, enum_maps, label_to_enum):
        raw = str(cond.value).strip()
        raw_lc = raw.lower()

        # 1) direct hit
        if raw in label_to_enum:
            driver, const_val = label_to_enum[raw]
            enum_map = enum_maps.get(driver, {})
            return enum_map.get(str(const_val), const_val)

        # 2) fuzzy hit (handles chkXxx names vs labels)
        for label, (driver, const_val) in label_to_enum.items():
            lab_lc = str(label).strip().lower()
            if raw_lc == lab_lc or raw_lc in lab_lc or lab_lc in raw_lc:
                enum_map = enum_maps.get(driver, {})
                return enum_map.get(str(const_val), const_val)

        # 3) normal enum mapping by driver
        driver_key = cond.driver.split(".")[-1]
        mapping = enum_maps.get(driver_key)
        return mapping.get(str(raw), raw) if mapping else raw
