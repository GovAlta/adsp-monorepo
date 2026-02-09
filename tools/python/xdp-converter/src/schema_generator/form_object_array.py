from typing import List

from schema_generator.form_element import FormElement, JsonSchemaElement
from xdp_parser.parse_context import ParseContext


class FormObjectArray(FormElement):
    def __init__(
        self,
        name: str,
        qualified_name,
        columns: List[FormElement],
        context: ParseContext,
    ):
        super().__init__("object_array", name, qualified_name, context)
        self.name = name
        self.is_leaf = True
        self.elements = columns
        self.can_group_horizontally = False

    def whoAmI(self):
        return
        print(f"[LWD]: {self.name} has {len(self.elements)}")

    def has_json_schema(self) -> bool:
        return True

    def to_json_schema(self) -> JsonSchemaElement:
        items = {}
        for element in self.elements:
            if element.has_json_schema() and element.name:
                items[element.name] = element.to_json_schema()
        item_props = {"type": "object", "properties": items}
        return {"type": "array", "items": item_props}

    def build_ui_schema(self) -> JsonSchemaElement:
        detail_elements = []

        for child in self.elements:
            # its important to call to_ui_schema on the child here, because it may have
            # rules that need to be included in the output
            child_ui = child.to_ui_schema()
            detail_elements.append(child_ui)

        return {
            "type": "ListWithDetail",
            "scope": f"#/properties/{self.name}",
            "label": self.label or self.name,
            "options": {
                "detail": {
                    "type": "VerticalLayout",
                    "elements": detail_elements,
                }
            },
        }
