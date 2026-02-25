from __future__ import annotations
from abc import ABC, abstractmethod
from visibility_rules.stages.context_types import (
    JsonFormsRuleEntry,
    JsonSchemaElement,
    UISchema,
)
from xdp_parser.parse_context import ParseContext
from typing import Optional


debug = False


class FormElement(ABC):
    def __init__(
        self, type: str, name: str, qualified_name: Optional[str], context: ParseContext
    ):
        self.type = type
        self.name = name
        self.qualified_name = qualified_name
        self.context = context
        self.is_leaf = True
        self.is_radio = False
        self.label = None
        self.format: Optional[str] = None
        self.enum: list[str] = []
        self.children = []
        self.can_group_horizontally = True

    @abstractmethod
    def has_json_schema(self) -> bool:
        pass

    @abstractmethod
    def to_json_schema(self) -> list[JsonSchemaElement]:
        pass

    @abstractmethod
    def build_ui_schema(self) -> Optional[UISchema]:
        pass

    def has_children(self) -> bool:
        return not self.is_leaf and self.children is not None and len(self.children) > 0

    def get_children(self):
        return self.children

    def update_label(self, label: str):
        self.label = label

    def _find_visibility_rule(
        self, qualified_name: Optional[str], rules: dict[str, JsonFormsRuleEntry]
    ) -> Optional[JsonFormsRuleEntry]:
        # No path? No rule.
        if qualified_name is None or rules is None:
            return None

        # Direct match
        if qualified_name in rules:
            if debug:
                print(f"Found rule for: {qualified_name}")
                print(f"    Rule details: {rules[qualified_name]}")
            return rules[qualified_name]

        # Prefix match (rule applies to a parent subform)
        for key, rule in rules.items():
            if key and qualified_name.startswith(key + "."):
                return rule
        return None

    def to_ui_schema(self) -> Optional[UISchema]:
        schema = self.build_ui_schema()
        if not schema:
            return None
        rules = self.context.get_jsonforms_rules()
        rule_entry = self._find_visibility_rule(self.qualified_name, rules)
        if rule_entry is not None:
            schema["rule"] = rule_entry["rule"]
        return schema

    def print_form_element(self):
        print("Element properties:")
        print(f"    type: {self.type}")
        print(f"    leaf: {self.is_leaf}")
        print(f"    has Json schema: {self.has_json_schema()}")
        print(f"    name: {self.name}")
        print(f"    qualified name: {self.qualified_name}")
        print(f"    label: {self.label}")
