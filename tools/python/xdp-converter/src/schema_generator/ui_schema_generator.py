from typing import Dict, List, Optional
from schema_generator.form import Form
from schema_generator.form_element import FormElement


class UiSchemaGenerator:
    def __init__(self, sections: List[FormElement]):
        self.sections = sections

    def to_schema(self):
        the_form = Form(self.sections)
        return the_form.to_ui_schema()
