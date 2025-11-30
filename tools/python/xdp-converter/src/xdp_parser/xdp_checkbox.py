from schema_generator.form_checkbox import FormCheckbox
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement


class XdpCheckbox(XdpElement):
    def __init__(self, xdp, labels, context: ParseContext):
        super().__init__(xdp, labels, context)

    def to_form_element(self):
        return FormCheckbox(
            self.get_name(), self.full_path, "boolean", self.get_label(), self.context
        )

    def is_control(self):
        return True
