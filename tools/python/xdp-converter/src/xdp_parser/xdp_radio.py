from xdp_parser.xdp_element import XdpElement


class XdpRadio(XdpElement):
    def __init__(self, xdp):
        super().__init__(xdp)

    def to_form_element(self):
        options = []
        for field in self.xdp_element.findall(".//field"):
            caption_value = field.find(".//caption/value/text")
            if caption_value is not None and caption_value.text:
                options.append(caption_value.text.strip())
        if options:
            print(f"options found: {self.xdp_element.get('name')}: {options}")
            fe = super().to_form_element()
            fe.enum = options
            fe.is_radio = True
            return fe
