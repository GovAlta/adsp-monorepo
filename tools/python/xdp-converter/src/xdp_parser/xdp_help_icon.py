from schema_generator.form_help_text import FormHelpText
from xdp_parser.xdp_help_text import XdpHelpText


class XdpHelpIcon(XdpHelpText):
    def is_help_icon(self) -> bool:
        return True

    def to_form_element(self):
        icon = "ℹ️"
        text = self.text
        return FormHelpText(
            self.get_name(), self.full_path, icon, self.is_header(), self.context
        )
