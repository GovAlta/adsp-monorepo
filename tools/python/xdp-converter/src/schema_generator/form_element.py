from abc import ABC, abstractmethod

from visibility_rules.pipeline_context import CTX_JSONFORMS_RULES
from xdp_parser.parse_context import ParseContext

type JsonSchemaElement = dict[str, str]


class FormElement(ABC):
    def __init__(self, type: str, name, qualified_name, context: ParseContext):
        self.type = type
        self.name = name
        self.qualified_name = qualified_name
        self.context = context
        self.is_leaf = True
        self.is_radio = False
        self.label = None
        self.format = None
        self.enum = None
        self.children = None
        self.can_group_horizontally = True

    @abstractmethod
    def has_json_schema(self):
        pass

    @abstractmethod
    def to_json_schema() -> JsonSchemaElement:
        pass

    @abstractmethod
    def build_ui_schema() -> JsonSchemaElement:
        pass

    def update_label(self, label: str):
        self.label = label

    def _find_visibility_rule(self, qualified_name: str, rules: dict) -> dict | None:
        # No path? No rule.
        if not qualified_name:
            return None

        # Direct match
        if qualified_name in rules:
            return rules[qualified_name]

        # Prefix match (rule applies to a parent subform)
        for key, rule in rules.items():
            if key and qualified_name.startswith(key + "."):
                return rule
        return None

    def to_ui_schema(self):
        schema = self.build_ui_schema()
        if not schema:
            return None
        rules = self.context.get(CTX_JSONFORMS_RULES) or {}
        rule_entry = self._find_visibility_rule(self.qualified_name, rules)
        if rule_entry is not None:
            schema["rule"] = rule_entry["rule"]
        return schema
