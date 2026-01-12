from schema_generator.form_help_text import FormHelpText
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement
import xml.etree.ElementTree as ET


class XdpHelpText(XdpElement):
    def __init__(self, anchor_element, help_content: str, context: ParseContext):
        self.text = help_content
        super().__init__(anchor_element, context=context)

    def to_form_element(self):
        return FormHelpText(self.text, self.context)

    def is_help_text(self):
        return True
