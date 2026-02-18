from schema_generator.form_element import FormElement, JsonSchemaElement
from xdp_parser.parse_context import ParseContext


class Form(FormElement):
    def __init__(self, sections, context: ParseContext):
        super().__init__("form", None, None, context)
        self.sections = sections
        self.is_leaf = False

    def build_ui_schema(self) -> JsonSchemaElement:
        ui_schema = {"type": "VerticalLayout"}
        ui_schema["elements"] = []
        for section in self.sections:
            child = section.to_ui_schema()
            if child:
                ui_schema["elements"].append(child)
        return ui_schema

    def has_json_schema(self) -> bool:
        return True

    def to_json_schema(self) -> JsonSchemaElement:
        schemas = []
        for element in self.sections:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas
