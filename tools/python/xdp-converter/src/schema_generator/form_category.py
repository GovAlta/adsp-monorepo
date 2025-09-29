from typing import Optional
from schema_generator.form_element import FormElement
from schema_generator.section_title import SectionTitle
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


def group_horizontally(elements, tolerance_mm=1.0, max_per_row=4):
    if not elements:
        return []

    rows = []
    current_row = [elements[0]]
    y_last = float(elements[0].y)

    for element in elements[1:]:
        y = float(element.y)
        # If within tolerance and row not full, add to current row
        if abs(y_last - y) <= tolerance_mm and len(current_row) < max_per_row:
            current_row.append(element)
        else:
            rows.append(current_row)
            current_row = [element]
            y_last = y

    # Append the last row
    if current_row:
        rows.append(current_row)

    # Group rows: if more than one element, wrap in FormLayout
    groups = []
    for row in rows:
        if len(row) > 1:
            groups.append(FormLayout("HorizontalLayout", row))
        else:
            groups.extend(row)  # single element, just add it

    return groups
