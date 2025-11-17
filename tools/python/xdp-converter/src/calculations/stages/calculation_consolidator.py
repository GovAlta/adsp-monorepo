class CalculationConsolidator:
    """
    Merges multiple calculations or references for the same target.
    """

    def process(self, context):
        normalized_calcs = context.get("normalized_calculations", [])
        print("[CalculationConsolidator] Consolidating calculation rules...")
        # TODO: merge if needed (rarely necessary, but placeholder for symmetry)
        context["consolidated_calculations"] = normalized_calcs
        return context
