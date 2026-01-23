from visibility_rules.stages.static_hidden_pruner import StaticHiddenPruner
from visibility_rules.stages.visibility_script_extractor import (
    VisibilityScriptExtractor,
)
from visibility_rules.stages.driver_resolver import DriverResolver
from visibility_rules.stages.rule_consolidator import RuleConsolidator
from visibility_rules.stages.jsonforms_emitter import JsonFormsEmitter

debug = False


class VisibilityRulesPipeline:
    def __init__(self):
        self.stages = [
            VisibilityScriptExtractor(),
            DriverResolver(),
            RuleConsolidator(),
            JsonFormsEmitter(),
            StaticHiddenPruner(),
        ]

    def run(self, context):
        if debug:
            print("\n=== PIPELINE START ===")
        for stage in self.stages:
            name = stage.__class__.__name__
            if debug:
                print(f"\n--- Stage: {name} ---")
            context = stage.process(context)
        if debug:
            print("=== PIPELINE END ===\n")
        return context
