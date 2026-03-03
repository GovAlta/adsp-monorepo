from schema_generator.form_file_upload import FormFileUpload
from xdp_parser.xdp_element import XdpElement


class XdpFileUpload(XdpElement):
    def __init__(self, xdp, labels, context):
        super().__init__(xdp, labels, context)

    def is_control(self):
        return True

    def to_form_element(self):
        control_description = self.get_label()
        fe = FormFileUpload(
            self.get_name(),
            self.full_path,
            self.get_type(),
            control_description.label if control_description else "",
            self.context,
        )
        fe.enum = self.get_enumeration_values()
        fe.format = self.get_format()
        return fe
