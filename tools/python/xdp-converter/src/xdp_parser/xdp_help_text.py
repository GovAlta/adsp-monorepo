from schema_generator.form_help_text import FormHelpText
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement


class XdpHelpText(XdpElement):
    def __init__(self, anchor_element, help_content: str, context: ParseContext):
        self.text = help_content
        super().__init__(anchor_element, context=context)

    def to_form_element(self):
        return FormHelpText(
            self.get_name(), self.full_path, self.text, self.is_header(), self.context
        )

    def is_help_text(self):
        return True

    def is_help_icon(self) -> bool:
        return False

    def help_text(self) -> str:
        return self.text

    def can_promote_to_header(self) -> bool:
        return True
