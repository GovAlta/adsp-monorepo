from schema_generator.form_category import group_horizontally
from schema_generator.form_element import FormElement


class FormGroup(FormElement):
    def __init__(self, label, elements):
        super().__init__("group")
        self.elements = group_horizontally(elements)
        self.label = label
        self.is_leaf = False

    def to_ui_schema(self):
        ui_schema = {"type": "Group"}
        ui_schema["elements"] = []
        for element in self.elements:
            ui_schema["elements"].append(element.to_ui_schema())
        return ui_schema

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        schemas = []
        for element in self.elements:
            if element.has_json_schema():
                schemas.append(element.to_json_schema())
        return schemas
