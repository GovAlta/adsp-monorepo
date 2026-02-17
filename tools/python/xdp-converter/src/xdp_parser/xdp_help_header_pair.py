from xdp_parser.xdp_layout import XdpLayout
from xdp_parser.xdp_element import XdpElement

debug = False


class XdpHelpHeaderPair(XdpLayout):
    def __init__(self, help_elem: XdpElement, header_elem: XdpElement, context):
        super().__init__(
            help_elem.xdp_element, "VerticalLayout", [header_elem, help_elem]
        )
        self.context = context
        self.header_elem = header_elem
        self.help_elem = help_elem
        if debug:
            name = header_elem.get_name()
            text = help_elem.help
            print(f"[XdpHelpHeaderPair] Created pair: {name} -> {text}")

    @property
    def header(self) -> XdpElement:
        return self.header_elem

    @property
    def help(self) -> XdpElement:
        return self.help_elem

    def is_control(self) -> bool:
        return False

    def is_help_text(self):
        return self.help_elem.is_help_text()

    def is_help_icon(self):
        return self.help_elem.is_help_icon()

    def footprint(self):
        return self.header.footprint()

    def to_form_element(self):
        return super().to_form_element()
