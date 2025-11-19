from schema_generator.form_input import FormInput
from xdp_parser.xdp_element import XdpElement


class XdpBasicInput(XdpElement):
    def __init__(self, xdp, labels, context):
        super().__init__(xdp, labels, context)

    def to_form_element(self):
        fe = FormInput(
            self.get_name(),
            self.full_path,
            self.get_type(),
            self.get_label(),
            self.context,
        )
        fe.x = self.extract_coordinate("x")
        fe.y = self.extract_coordinate("y")
        fe.enum = self.get_enumeration_values()
        fe.label = self.get_label()
        fe.format = self.get_format()
        return fe
