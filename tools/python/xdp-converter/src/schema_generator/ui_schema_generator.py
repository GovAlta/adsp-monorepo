from typing import List
from schema_generator.form import Form
from schema_generator.form_element import FormElement
from schema_generator.prune_ui_schema import prune_ui_schema
from xdp_parser.parse_context import ParseContext


class UiSchemaGenerator:
    def __init__(self, sections: List[FormElement], context: ParseContext):
        self.sections = sections
        self.context = context

    def to_schema(self):
        the_form = Form(self.sections, self.context)
        schema = the_form.to_ui_schema()
        return prune_ui_schema(schema)
