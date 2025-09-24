from schema_generator.form_layout import FormLayout
from xdp_parser.xdp_utils import strip_label_prefix


# An annotated control represents a selector that has different "help" messages
# depending on the selection. It generates a HorizontalLayout with the selector
# on the left and the selected help message on the right.
class AnnotatedControl(FormLayout):

    def __init__(self, elements):
        super().__init__("HorizontalLayout", elements)

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        return super().to_json_schema()

    def to_ui_schema(self):
        return super().to_ui_schema()
