class CalculationNormalizer:
    """
    Normalizes calculation expressions for downstream processing.
    """

    def process(self, context):
        raw_rules = context.get("raw_calculation_rules", [])
        print("[CalculationNormalizer] Normalizing calculation expressions...")
        # TODO: parse expressions into standardized structure
        context["normalized_calculations"] = raw_rules
        return context
