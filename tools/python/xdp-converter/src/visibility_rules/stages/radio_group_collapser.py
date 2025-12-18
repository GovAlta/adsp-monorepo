# radio_group_collapser.py
from visibility_rules.pipeline_context import (
    CTX_ENUM_MAP,
    CTX_RADIO_GROUPS,
    CTX_RESOLVED_RULES,
)


class RadioGroupCollapser:
    """
    Converts raw Adobe checkbox-based radio groups like:
        chkStandard → Section2 = "Standard"
        chkContingency → Section2 = "Contingency"
    """

    def process(self, context):
        radio_groups = context.get(CTX_RADIO_GROUPS, {})
        enum_map = context.get(CTX_ENUM_MAP, {})
        rules = context.get(CTX_RESOLVED_RULES, [])

        # ---------------------------------------------------------
        # STEP 1 — Build reverse mapping: chkX → (Section2, label)
        # ---------------------------------------------------------
        reverse_map = {}

        for group_name, raw_fields in radio_groups.items():
            if group_name not in enum_map:
                continue

            group_enum = enum_map[group_name]  # { "1": "Standard", ... }

            if len(group_enum) != len(raw_fields):
                continue

            # zip fields to enum labels
            sorted_labels = [group_enum[k] for k in sorted(group_enum, key=int)]

            for raw_field, human_label in zip(raw_fields, sorted_labels):
                reverse_map[raw_field] = (group_name, human_label)

        # ---------------------------------------------------------
        # STEP 2 — Rewrite rules using reverse_map
        # ---------------------------------------------------------
        for rule in rules:
            for cond in rule.triggers:
                driver = cond.driver

                if driver in reverse_map:
                    group_name, human_label = reverse_map[driver]
                    cond.driver = group_name
                    cond.value = human_label
        print(f"[RGC] OUT: {len(rules)} rewritten rules")
        return context
