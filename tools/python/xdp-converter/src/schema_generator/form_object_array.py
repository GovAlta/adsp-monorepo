from typing import Dict, List

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
        self.debug = True
        if self.debug:
            self.whoAmI()

    def whoAmI(self):
        print(f"[LWD]: {self.name} has {len(self.elements)}")

    def has_json_schema(self) -> bool:
        return True

    def to_json_schema(self) -> JsonSchemaElement:
        items = self.collect_item_properties(self.elements)
        item_props = {"type": "object", "properties": items}
        return {"type": "array", "items": item_props}

    def collect_item_properties(
        self, elements: List[FormElement]
    ) -> Dict[str, JsonSchemaElement]:
        props: Dict[str, JsonSchemaElement] = {}

        for element in elements:
            if element.has_children():
                child_props = self.collect_item_properties(element.get_children())
                for key, val in child_props.items():
                    if key in props:
                        raise ValueError(
                            f"Duplicate property '{key}' while building schema for object array '{self.name}'. "
                        )
                    props[key] = val
                continue

            # Case 2: normal leaf control -> use its name as property key
            if element.is_leaf and element.has_json_schema():
                if not element.name:
                    raise ValueError(
                        f"Element '{element.get_name()}' inside object array '{self.name}' "
                        f"claims it has JSON schema but has no name to use as a property key."
                    )
                props[element.name] = element.to_json_schema()

        return props

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
