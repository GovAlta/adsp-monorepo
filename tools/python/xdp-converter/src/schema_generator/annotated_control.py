from schema_generator.form_layout import FormLayout
from xdp_parser.parse_context import ParseContext


# An annotated control represents a selector that has different "help" messages
# depending on the selection. It generates a HorizontalLayout with the selector
# on the left and the selected help message on the right.
class AnnotatedControl(FormLayout):

    def __init__(self, elements, context: ParseContext):
        super().__init__("HorizontalLayout", elements, context)

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        return super().to_json_schema()

    def build_ui_schema(self):
        # return super().build_ui_schema()
        schemas = []
        for element in self.elements:
            schemas.append(element.build_ui_schema())
        return schemas
