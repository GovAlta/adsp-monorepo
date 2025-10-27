from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import get_field_caption


class XdpRadio(XdpElement):
    def __init__(self, xdp, labels):
        super().__init__(xdp, labels)

    def to_form_element(self):
        options = []

        for field in self.xdp_element.findall(".//field"):
            button_text = get_field_caption(field)
            if button_text:
                options.append(button_text)

        if options:
            fe = super().to_form_element()
            fe.enum = options
            fe.is_radio = True
            return fe
