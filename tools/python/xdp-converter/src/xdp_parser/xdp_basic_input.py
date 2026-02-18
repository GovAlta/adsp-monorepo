from schema_generator.form_input import FormInput
from xdp_parser.xdp_element import XdpElement


class XdpBasicInput(XdpElement):
    def __init__(self, xdp, labels, context):
        super().__init__(xdp, labels, context)

    def is_control(self):
        return True

    def to_form_element(self):
        fe = FormInput(
            self.get_name(),
            self.full_path,
            self.get_type(),
            self.get_display_label(),
            self.context,
        )
        fe.enum = self.get_enumeration_values()
        fe.format = self.get_format()
        return fe

    def get_display_label(self) -> str:
        display_label = self.get_label()
        if display_label:
            label = display_label.label
            description = display_label.description
            if label and description:
                return f"{label} {description}"
            elif label:
                return label

        return None
