from abc import ABC, abstractmethod


# Abstract form element, can be one of FormInput or Guidance
class FormElement(ABC):
    def __init__(self, type: str, name, qualified_name):
        self.type = type
        self.name = name
        self.qualified_name = qualified_name
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

    def to_ui_schema(self):
        # TODO make this go away by passing in rules from outside.
        from xdp_parser.parse_xdp import XdpParser

        schema = self.build_ui_schema()
        rules = XdpParser().visibility_rules
        if self.qualified_name != None and self.qualified_name in rules:
            schema["rule"] = rules[self.qualified_name]["rule"]
        return schema
