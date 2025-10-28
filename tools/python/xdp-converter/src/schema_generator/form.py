from typing import Optional
from schema_generator.form_element import FormElement


class Form(FormElement):
    def __init__(self, sections):
        super().__init__("form")
        self.sections = sections
        self.is_leaf = False

    def to_ui_schema(self, rules: Optional[dict] = None):
        ui_schema = {"type": "VerticalLayout"}
        ui_schema["elements"] = []
        for group in self.sections:
            ui_schema["elements"].append(group.to_ui_schema(rules))
        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        schemas = []
        for element in self.sections:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas
