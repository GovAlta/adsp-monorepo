from common.rule_model import VisibilityRule


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

        normalized_rules: list[VisibilityRule] = context.get(
            "normalized_visibility_rules", []
        )
        enum_maps = context.get("extra_context", {})
        print(f"  [DEBUG] enum_maps: {enum_maps}")

        emitted = {}

        # --- main emission loop ---
        for rule in normalized_rules:
            print(f"\n  [DEBUG] --- EMIT START ---")
            print(
                f"  [DEBUG] Target={rule.target:<25} Effect={rule.effect:<8} CondCount={len(rule.conditions)}"
            )

            if len(rule.conditions) == 1:
                cond = rule.conditions[0]
                driver = cond.driver
                schema = {
                    "const": self.resolve_enum_value(driver, cond.value, enum_maps)
                }
                scope = f"#/properties/{driver}"
            else:
                props = {}
                for cond in rule.conditions:
                    # skip self-references (e.g., Adult rule with driver=Adult)
                    if cond.driver.split(".")[-1] == rule.target.split(".")[-1]:
                        print(
                            f"  [DEBUG] skipping self-reference: {cond.driver} == {cond.value} for target {rule.target}"
                        )
                        continue

                    driver_key = cond.driver.split(".")[-1]
                    mapped_value = self._map_enum_value(
                        driver_key, cond.value, enum_maps
                    )
                    props[driver_key] = {"const": mapped_value}

                print(f"  [DEBUG] schema_props={props}")
                schema = {"properties": props}
                scope = "#/properties"

            # 🔹 Build JSONForms-style rule entry
            rule_entry = {
                "effect": "SHOW" if rule.effect.upper() == "VISIBLE" else "HIDE",
                "condition": {"scope": scope, "schema": schema},
            }

            # 🔹 Merge with existing entries for same target
            if rule.target not in emitted:
                emitted[rule.target] = {"rules": [rule_entry]}
            else:
                emitted[rule.target]["rules"].append(rule_entry)

        # 🔹 Normalize single-rule entries
        for _, data in emitted.items():
            if len(data["rules"]) == 1:
                data["rule"] = data.pop("rules")[0]

        context["jsonforms_visibility_rules"] = emitted

        print(f"[JsonFormsEmitter] Emitted {emitted}")
        print("[JsonFormsEmitter] Done.\n")
        return context

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
        print("driver is: ", driver)
        if enum_map and value_key in enum_map:
            mapped = enum_map[value_key]
            print(f"  [DEBUG] enum resolved (exact): {driver} {value_key} → {mapped}")
            return mapped

        if "." in driver:
            last = driver.split(".")[-1]
            enum_map = enum_maps.get(last)
            if enum_map and value_key in enum_map:
                mapped = enum_map[value_key]
                print(
                    f"  [DEBUG] enum resolved (fallback): {driver} → {last} {value_key} → {mapped}"
                )
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
