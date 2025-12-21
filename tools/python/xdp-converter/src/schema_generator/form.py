from visibility_rules.pipeline_context import CTX_JSONFORMS_RULES
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
            child = section.to_ui_schema()
            if child:
                ui_schema["elements"].append(child)
        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        rules = self.context.get(CTX_JSONFORMS_RULES) or {}

        schemas = []
        for element in self.sections:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas
