from abc import ABC, abstractmethod

from xdp_parser.parse_context import ParseContext


# Abstract form element, can be one of FormInput or Guidance
class FormElement(ABC):
    def __init__(self, type: str, name, qualified_name, context: ParseContext):
        self.type = type
        self.name = name
        self.qualified_name = qualified_name
        self.context = context
        self.is_leaf = True
        self.y = 0
        self.x = 0
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
    def to_json_schema():
        pass

    @abstractmethod
    def build_ui_schema():
        pass

    def _find_visibility_rule(self, rules: dict) -> dict | None:
        if not self.qualified_name:
            return None

        parts = self.qualified_name.split(".")
        checked = set()

        # --- First, try suffixes (deepest child first)
        for i in range(len(parts)):
            suffix = ".".join(parts[i:])
            if suffix not in checked:
                checked.add(suffix)
                if suffix in rules:
                    print(f"  [DEBUG] Matched visibility rule for {suffix}")
                    return rules[suffix]

        # --- Then, try progressive parent paths (from deepest to shallow)
        for i in range(len(parts) - 1, 0, -1):
            parent = ".".join(parts[:i])
            if parent not in checked:
                checked.add(parent)
                if parent in rules:
                    print(f"  [DEBUG] Matched visibility rule for parent {parent}")
                    return rules[parent]

        return None

    def to_ui_schema(self):
        schema = self.build_ui_schema()
        rules = self.context.get("visibility_rules") or {}
        rule_entry = self._find_visibility_rule(rules)
        if rule_entry is not None:
            schema["rule"] = rule_entry["rule"]
        return schema
