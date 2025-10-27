from schema_generator.form_checkbox import FormCheckbox
from xdp_parser.xdp_element import XdpElement


class XdpCheckbox(XdpElement):
    def __init__(self, xdp, labels):
        super().__init__(xdp, labels)

    def to_form_element(self):
        return FormCheckbox(self.get_name(), "boolean", self.get_label())
