from schema_generator.form_element import FormElement, JsonSchemaElement, UISchema
from xdp_parser.parse_context import ParseContext


class FormLayout(FormElement):
    def __init__(self, type: str, children: list[FormElement], context: ParseContext):
        super().__init__("layout", "", None, context)
        self.type = type
        self.children = children
        self.is_leaf = False

    def build_ui_schema(self) -> JsonSchemaElement:
        ui_schema: UISchema = {"type": self.type}
        ui_schema["elements"] = []
        for element in self.children:
            child = element.to_ui_schema()
            if child:
                ui_schema["elements"].append(child)
        return ui_schema

    def has_json_schema(self) -> bool:
        return True

    def to_json_schema(self) -> list[JsonSchemaElement]:
        schemas = []
        for element in self.children:
            if element.has_json_schema():
                schemas.extend(element.to_json_schema())
        return schemas
