from constants import CTX_FINAL_RULES


class RuleConsolidator:
    """
    Consolidates rules for the same target/effect pair.
    Adds deep debug statements to trace merging behaviour.
    """

    def process(self, context):
        rules = context.get(CTX_FINAL_RULES, [])
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

        print(
            f"[RuleConsolidator] Consolidated {len(consolidated)} merged rules total.\n"
        )

        context[CTX_FINAL_RULES] = consolidated
        return context
