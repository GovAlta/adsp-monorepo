from typing import Optional
from schema_generator.form_element import FormElement


class FormCategorization(FormElement):
    def __init__(self, categories):
        super().__init__("categorization")
        self.categories = categories
        self.is_leaf = False

    def to_ui_schema(self, rules: Optional[dict] = None):
        ui_schema = {"type": "Categorization"}
        ui_schema["options"] = {"variant": "pages"}
        ui_schema["elements"] = []
        for category in self.categories:
            ui_schema["elements"].append(category.to_ui_schema(rules))
        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        schemas = []
        for element in self.categories:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas
