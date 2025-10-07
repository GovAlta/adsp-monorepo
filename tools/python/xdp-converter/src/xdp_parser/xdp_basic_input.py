from xdp_parser.xdp_element import XdpElement


class XdpBasicInput(XdpElement):
    def __init__(self, xdp, labels):
        super().__init__(xdp, labels)

    def to_form_element(self):
        return super().to_form_element()
