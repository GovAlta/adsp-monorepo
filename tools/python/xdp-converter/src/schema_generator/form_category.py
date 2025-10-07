from typing import Optional
from schema_generator.form_element import FormElement
from schema_generator.form_layout import group_horizontally
from schema_generator.section_title import SectionTitle


class FormCategory(FormElement):
    def __init__(self, name, title, elements):
        super().__init__("category")
        self.name = name
        self.title = title
        self.elements = group_horizontally(elements)
        self.is_leaf = False

    def to_ui_schema(self, rules: Optional[dict] = None):
        ui_schema = {"type": "Category"}
        ui_schema["label"] = self.title
        ui_schema["elements"] = [SectionTitle(self.title).to_ui_schema()]
        for element in self.elements:
            ui_schema["elements"].append(element.to_ui_schema())
        if self.name in rules:
            ui_schema["rule"] = rules[self.name]
        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        schemas = []
        for element in self.elements:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas
