from abc import abstractmethod
from typing import Optional


# Abstract form element, can be one of FormInput or Guidance
class FormElement:
    def __init__(self, type: str):
        self.type = type
        self.is_leaf = True
        self.y = 0
        self.x = 0
        self.name = None
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
    def to_ui_schema(self, rules: Optional[dict] = None):
        pass
