from schema_generator.form_input import FormInput
from xdp_parser.xdp_element import XdpElement


class XdpBasicInput(XdpElement):
    def __init__(self, xdp, labels, context):
        super().__init__(xdp, labels, context)

    def is_control(self):
        return True

    def to_form_element(self):
        labeling = self.get_label()
        label = labeling.label if labeling else ""
        fe = FormInput(
            self.get_name(),
            self.full_path,
            self.get_type(),
            label,
            self.context,
        )
        fe.enum = self.get_enumeration_values()
        fe.format = self.get_format()
        return fe
