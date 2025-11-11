from typing import Dict, List, Optional
from schema_generator.form import Form
from schema_generator.form_element import FormElement
from xdp_parser.parse_context import ParseContext


class UiSchemaGenerator:
    def __init__(self, sections: List[FormElement], context: ParseContext):
        self.sections = sections
        self.context = context

    def to_schema(self):
        the_form = Form(self.sections, self.context)
        return the_form.to_ui_schema()
