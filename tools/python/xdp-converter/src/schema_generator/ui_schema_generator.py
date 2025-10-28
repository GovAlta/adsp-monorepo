from typing import List, Optional
from schema_generator.form import Form
from schema_generator.form_element import FormElement


class UiSchemaGenerator:
    def __init__(
        self, sections: List[FormElement], visibility_rules: Optional[dict] = None
    ):
        self.sections = sections
        self.visibility_rules = visibility_rules

    def to_schema(self):
        the_form = Form(self.sections)
        return the_form.to_ui_schema(self.visibility_rules)
