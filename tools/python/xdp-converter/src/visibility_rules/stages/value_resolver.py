from constants import CTX_ENUM_MAP, CTX_RESOLVED_RULES


class ValueResolver:
    def process(self, context):
        enum_map = context.get(CTX_ENUM_MAP, {})
        rules = context.get(CTX_RESOLVED_RULES, [])

        print(f"[ValueResolver] number of rules: {len(rules)}")

        for rule in rules:
            # rule.conditions is ALWAYS a list of VisibilityCondition
            for cond in getattr(rule, "conditions", []):
                self._resolve_condition(cond, enum_map)

        context[CTX_RESOLVED_RULES] = rules
        print(f"[ValueResolver] OUT: {len(rules)} rules")
        return context

    def _resolve_condition(self, cond, enum_map):
        driver = cond.driver
        raw_value = cond.value

        # If the driver isn't in the enum map, skip
        if driver not in enum_map:
            return

        mapping = enum_map[driver]
        key = str(raw_value).strip()

        if key in mapping:
            cond.value = mapping[key]
