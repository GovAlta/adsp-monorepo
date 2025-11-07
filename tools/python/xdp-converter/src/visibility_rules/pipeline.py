from visibility_rules.stages.visibility_script_extractor import (
    VisibilityScriptExtractor,
)
from visibility_rules.stages.driver_resolver import DriverResolver
from visibility_rules.stages.condition_normalizer import ConditionNormalizer
from visibility_rules.stages.rule_consolidator import RuleConsolidator
from visibility_rules.stages.jsonforms_emitter import JsonFormsEmitter


class VisibilityRulesPipeline:
    """
    Orchestrates all stages of the visibility rules processing pipeline.
    """

    def __init__(self):
        self.stages = [
            VisibilityScriptExtractor(),
            DriverResolver(),
            ConditionNormalizer(),
            RuleConsolidator(),
            JsonFormsEmitter(),
        ]

    def run(self, context):
        """
        Run the full pipeline starting from the XDP root node.
        """
        context = {**context, "rules": []}
        print(f"[VisibilityRulesPipeline] context is: {context.keys()}")

        for stage in self.stages:
            print(f"[{stage.__class__.__name__}] Starting...")
            context = stage.process(context)
            print(f"[{stage.__class__.__name__}] Done.\n")

        print("[VisibilityRulesPipeline] Pipeline complete.")
        return context.get("output", None)
