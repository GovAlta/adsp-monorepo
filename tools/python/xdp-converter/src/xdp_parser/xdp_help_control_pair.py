from xdp_parser.xdp_layout import XdpLayout  # wherever it lives
from xdp_parser.xdp_element import XdpElement


class XdpHelpControlPair(XdpLayout):
    def __init__(self, help_elem: XdpElement, control_elem: XdpElement, context):
        super().__init__(
            help_elem.xdp_element, "VerticalLayout", [control_elem, help_elem]
        )
        self.context = context
        self.control_elem = control_elem
        self.help_elem = help_elem

    @property
    def control(self) -> XdpElement:
        return self.control_elem

    @property
    def help(self) -> XdpElement:
        return self.help_elem

    def is_control(self) -> bool:
        return self.control_elem.is_control()

    def to_form_element(self):
        return super().to_form_element()
