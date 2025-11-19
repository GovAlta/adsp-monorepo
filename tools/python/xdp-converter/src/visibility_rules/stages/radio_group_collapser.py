from constants import (
    CTX_ENUM_MAP,
    CTX_RADIO_GROUPS,
    CTX_RESOLVED_RULES,
)


class RadioGroupCollapser:
    def process(self, context):
        radio_groups = context.get(CTX_RADIO_GROUPS, {})
        enum_map = context.get(CTX_ENUM_MAP, {})

        rules = context.get(CTX_RESOLVED_RULES, [])
        print(f"[RGC] Collapsing {len(rules)} rules…")

        driver_map = {}

        print("\n[RGC] ==== ENTERING RADIO GROUP COLLAPSER ====")
        print("[RGC] Radio groups:", radio_groups)
        print("[RGC] Number of resolved rules:", len(rules))
        print("[RGC] 'chk' drivers in rules:")
        for rule in rules:
            cond = rule.conditions[0]
            if cond.driver[:3] == "chk" or cond.driver == "section2":
                print(
                    "  driver:",
                    cond.driver,
                    "value:",
                    cond.value,
                    "→ target:",
                    rule.target,
                )

        for group, field_names in radio_groups.items():
            group_enum = enum_map.get(group, {})

            for index, field_name in enumerate(field_names, start=1):
                label = group_enum.get(str(index))
                if label:
                    driver_map[field_name] = (group, label)

        print("[RGC] driver_map generated:")
        for drv, (group, label) in driver_map.items():
            print(f"   {drv} → {group} :: {label}")
        # Rewrite rule conditions
        for rule in rules:
            for cond in rule.conditions:
                if cond.driver in driver_map:
                    group, label = driver_map[cond.driver]
                    cond.driver = group
                    cond.value = label

        # 🚨 IMPORTANT: WRITE BACK TO THE SAME KEY
        context[CTX_RESOLVED_RULES] = rules
        return context
