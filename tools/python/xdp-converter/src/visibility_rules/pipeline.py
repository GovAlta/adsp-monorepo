from constants import CTX_FINAL_RULES, CTX_RAW_RULES, CTX_RESOLVED_RULES
from visibility_rules.stages.radio_group_collapser import RadioGroupCollapser
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
        ]

    def run(self, context):
        for stage in self.stages:
            context = stage.process(context)
            print(
                f"[PIPE] After {stage.__class__.__name__}: "
                f"resolved={len(context.get('resolved_visibility_rules', []))}, "
                f"final={len(context.get('rules', []))}, "
                f"raw={len(context.get('raw_visibility_rules', []))}"
            )

        return context
