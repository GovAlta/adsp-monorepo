from calculations.stages.calculation_script_extractor import CalculationScriptExtractor
from calculations.stages.calculation_normalizer import CalculationNormalizer
from calculations.stages.calculation_consolidator import CalculationConsolidator
from calculations.stages.jsonforms_emitter import JsonFormsEmitter


class CalculationRulesPipeline:
    """
    Pipeline for extracting and transforming calculated field rules.
    """

    def __init__(self):
        self.stages = [
            CalculationScriptExtractor(),
            CalculationNormalizer(),
            CalculationConsolidator(),
            JsonFormsEmitter(),
        ]

    def run(self, xdp_root):
        context = {"xdp_root": xdp_root, "rules": []}

        for stage in self.stages:
            print(f"[{stage.__class__.__name__}] Starting...")
            context = stage.process(context)
            print(f"[{stage.__class__.__name__}] Done.\n")

        print("[CalculationRulesPipeline] Pipeline complete.")
        return context.get("output", None)
