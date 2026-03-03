# Extracted from scripts but not normalized
from visibility_rules.stages.context_types import JsonFormsRule, JsonFormsRuleEntry
from visibility_rules.stages.rule_model import VisibilityRule


CTX_RAW_RULES = "raw_visibility_rules"

# After DriverResolver + ValueResolver (these feed ConditionNormalizer)
CTX_RESOLVED_RULES = "resolved_visibility_rules"

# Final merged JsonForms-style rule definitions produced by RuleConsolidator
CTX_FINAL_RULES = "jsonforms_visibility_rules"

# XDP-derived data
CTX_ENUM_MAP = "enum_map"
CTX_PARENT_MAP = "parent_map"
CTX_LABEL_TO_ENUM = "label_to_enum"
CTX_XDP_ROOT = "xdp_root"
CTX_SUBFORM_MAP = "subform_map"

# Radio groups discovered during XDP parse stage
CTX_RADIO_GROUPS = "radio_groups"

# Final rules ready for JsonForms UI/Schema emitters
CTX_JSONFORMS_RULES = "jsonforms_rules"

CTX_TARGETED_GROUPS = "targeted_subforms"


class PipelineContext(dict):
    """
    Mutable staging dictionary used during visibility rule extraction.
    Pipeline stages freely read/write into this
    """

    final_rules: list[JsonFormsRule]

    def get_final_rules(self) -> list[VisibilityRule]:
        return self.get(CTX_FINAL_RULES, [])

    def get_jsonforms_rules(self) -> dict[str, JsonFormsRuleEntry]:
        return self.get(CTX_JSONFORMS_RULES, {})

    pass
