from schema_generator.form_element import FormElement
from xdp_parser.parse_context import ParseContext


class Form(FormElement):
    def __init__(self, sections, context: ParseContext):
        super().__init__("form", None, None, context)
        self.sections = sections
        self.is_leaf = False

    def build_ui_schema(self):
        ui_schema = {"type": "VerticalLayout"}
        ui_schema["elements"] = []
        for section in self.sections:
            ui_schema["elements"].append(section.to_ui_schema())
        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        schemas = []
        for element in self.sections:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas
