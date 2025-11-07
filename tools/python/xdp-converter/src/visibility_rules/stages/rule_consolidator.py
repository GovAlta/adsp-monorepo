class RuleConsolidator:
    """
    Consolidates rules for the same target/effect pair.
    Adds deep debug statements to trace merging behaviour.
    """

    def process(self, context):
        rules = context.get("normalized_visibility_rules", [])
        print("\n[RuleConsolidator] Starting...")

        # Group by (target, effect)
        grouped = {}
        for rule in rules:
            key = (rule.target, rule.effect)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(rule)

        consolidated = []
        for (target, effect), group in grouped.items():
            merged_conditions = []
            for r in group:
                merged_conditions.extend(r.conditions)

            merged_rule = group[0]
            merged_rule.conditions = merged_conditions
            consolidated.append(merged_rule)

            for c in merged_conditions:
                print(f"         • {c.driver} {c.operator} {c.value}")

        print(
            f"[RuleConsolidator] Consolidated {len(consolidated)} merged rules total.\n"
        )

        context["consolidated_visibility_rules"] = consolidated
        return context
