from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement


class XdpHeader(XdpElement):
    def __init__(self, anchor_element, header_text: str, context: ParseContext):
        super().__init__(anchor_element, context=context)
        self.header_text = header_text.strip()

    def is_control(self) -> bool:
        return False

    def is_header(self) -> bool:
        return True

    def header_text(self) -> str | None:
        return self.header_text
