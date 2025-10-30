from typing import List, Optional

from schema_generator.form_element import FormElement
from xdp_parser.xdp_element import XdpElement


class FormObjectArray(FormElement):
    def __init__(self, name: str, qualified_name, columns: List[XdpElement]):
        super().__init__("object_array", name, qualified_name)
        self.name = name
        # treating this as a leaf node, as it will translate into a single JSON object
        self.is_leaf = True
        self.elements = columns
        self.can_group_horizontally = False

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        items = {}
        for element in self.elements:
            if element.has_json_schema() and element.name:
                items[element.name] = element.to_json_schema()
        item_props = {"type": "object", "properties": items}
        return {"type": "array", "items": item_props}
        # return {self.name: {"type": "array", "items": items}}

    def build_ui_schema(self):
        control = {"type": "Control", "scope": f"#/properties/{self.name}"}
        control["label"] = self.label if self.label else self.name
        return control
