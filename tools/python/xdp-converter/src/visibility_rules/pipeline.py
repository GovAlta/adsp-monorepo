from visibility_rules.stages.radio_group_collapser import RadioGroupCollapser
from visibility_rules.stages.static_hidden_pruner import StaticHiddenPruner
from visibility_rules.stages.value_resolver import ValueResolver
from visibility_rules.stages.visibility_script_extractor import (
    VisibilityScriptExtractor,
)
from visibility_rules.stages.driver_resolver import DriverResolver
from visibility_rules.stages.condition_normalizer import ConditionNormalizer
from visibility_rules.stages.rule_consolidator import RuleConsolidator
from visibility_rules.stages.jsonforms_emitter import JsonFormsEmitter


class VisibilityRulesPipeline:
    def __init__(self):
        self.stages = [
            VisibilityScriptExtractor(),
            DriverResolver(),
            ValueResolver(),
            RadioGroupCollapser(),
            ConditionNormalizer(),
            RuleConsolidator(),
            JsonFormsEmitter(),
            StaticHiddenPruner(),
        ]

    def run(self, context):
        print("\n=== PIPELINE START ===")
        for stage in self.stages:
            name = stage.__class__.__name__
            print(f"\n--- Stage: {name} ---")
            context = stage.process(context)
        print("=== PIPELINE END ===\n")
        return context
