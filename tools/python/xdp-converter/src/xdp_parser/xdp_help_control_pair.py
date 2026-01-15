from xdp_parser.xdp_layout import XdpLayout  # wherever it lives
from xdp_parser.xdp_element import XdpElement


class XdpHelpControlPair(XdpLayout):
    def __init__(self, help_elem: XdpElement, control_elem: XdpElement, context):
        # Layout needs an xdp element; we can reuse help's xdp element safely
        super().__init__(
            help_elem.xdp_element, "VerticalLayout", [help_elem, control_elem]
        )
        self.context = context
        self.target = control_elem
        self.is_help_control_pair = True  # optional marker for debugging

    def is_control(self) -> bool:
        return self.target.is_control()
