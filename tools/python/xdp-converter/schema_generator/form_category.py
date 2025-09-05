from typing import Optional
from schema_generator.form_element import FormElement
from schema_generator.form_guidance import FormGuidance
from collections import defaultdict

from schema_generator.form_layout import FormLayout


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
        ui_schema["options"] = {"sectionTitle": self.title}
        ui_schema["elements"] = [FormGuidance(self.title).to_ui_schema()]
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


from collections import defaultdict


def group_horizontally(formElements, tolerance_mm=1.0):
    rows = defaultdict(list)
    for formElement in formElements:
        y = float(formElement.y)
        # Snap to closest existing row within tolerance
        for row_y in rows:
            if abs(row_y - y) <= tolerance_mm:
                rows[row_y].append(formElement)
                break
        else:
            rows[y].append(formElement)

    if len(rows) > 1:
        layouts = []
        for row in rows.values():
            layout = FormLayout("HorizontalLayout", row)
            layouts.append(layout)
        return layouts
    else:
        return formElements
