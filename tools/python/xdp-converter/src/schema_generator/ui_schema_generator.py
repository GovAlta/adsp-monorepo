from typing import List, Optional
from schema_generator.form import Form
from schema_generator.form_element import FormElement


class UiSchemaGenerator:
    def __init__(self, sections: List[FormElement], rules: Optional[dict] = None):
        self.sections = sections
        self.rules = rules

    def to_schema(self):
        the_form = Form(self.sections)
        return the_form.to_ui_schema(self.rules)
