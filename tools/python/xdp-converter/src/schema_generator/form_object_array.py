from typing import List

from schema_generator.form_element import FormElement, JsonSchemaElement
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement


class FormObjectArray(FormElement):
    def __init__(
        self,
        name: str,
        qualified_name,
        columns: List[XdpElement],
        context: ParseContext,
    ):
        super().__init__("object_array", name, qualified_name, context)
        self.name = name
        # treating this as a leaf node, as it will translate into a single JSON object
        self.is_leaf = True
        self.elements = columns
        self.can_group_horizontally = False

    def has_json_schema(self) -> bool:
        return True

    def to_json_schema(self) -> JsonSchemaElement:
        items = {}
        for element in self.elements:
            if element.has_json_schema() and element.name:
                items[element.name] = element.to_json_schema()
        item_props = {"type": "object", "properties": items}
        return {"type": "array", "items": item_props}
        # return {self.name: {"type": "array", "items": items}}

    def build_ui_schema(self) -> JsonSchemaElement:
        detail_elements = []

        for child in self.elements:
            child_ui = child.build_ui_schema()

            # 🔥 Rewrite the child scope so it lives under the array's item schema
            if isinstance(child_ui, dict) and "scope" in child_ui:
                original = child_ui["scope"]  # e.g., "#/properties/cboForestryCode"
                name = original.split("/")[-1]  # e.g., "cboForestryCode"

                # Inject correct array path
                child_ui["scope"] = f"#/properties/{self.name}/items/properties/{name}"

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
