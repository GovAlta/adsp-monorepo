# Extracted from scripts but not normalized
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

# Radio groups discovered during XDP parse stage
CTX_RADIO_GROUPS = "radio_groups"

# Final rules ready for JsonForms UI/Schema emitters
CTX_JSONFORMS_RULES = "jsonforms_rules"

CTX_VISIBILITY_GROUPS = "visibility_groups"
