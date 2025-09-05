from typing import List, Optional
from schema_generator.form_categorization import FormCategorization
from schema_generator.form_element import FormElement
from schema_generator.form_layout import FormLayout

_left_margin = 6.376


class UiSchemaGenerator:
    def __init__(self, inputs: List[FormElement], rules: Optional[dict] = None):
        self.inputs = inputs
        self.rules = rules

    def to_schema(self):
        categorization = FormCategorization(
            self._group_horizontal_elements(self.inputs)
        )
        return categorization.to_ui_schema(self.rules)

    def _group_horizontal_elements(self, inputs: List[FormElement]):
        rows = []
        current_row = []
        for input in inputs:
            new_y = getattr(input, "y", _left_margin)
            if self._is_on_left_margin(new_y):
                self._add_row(current_row, rows)
                current_row = []
            current_row.append(input)

        if current_row:
            self._add_row(current_row, rows)

        return rows

    def _add_row(self, row, rows):
        if len(row) > 1:
            rows.append(FormLayout("HorizontalLayout", row))
        elif len(row) == 1:
            rows.append(row[0])

    def _is_on_left_margin(self, y):
        return abs(_left_margin - y) < 5  # on or near; < 5mm
