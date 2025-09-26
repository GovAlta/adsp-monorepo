import re
from xdp_parser.xdp_element import XdpElement


class XdpRadio(XdpElement):
    def __init__(self, xdp):
        super().__init__(xdp)

    def to_form_element(self):
        options = []

        for field in self.xdp_element.findall(".//field"):
            if field.get("name") == "SAOwned":
                print("SAOwned to form element")
            caption = field.find(".//caption/value")
            label_text = None

            if caption is not None:
                # Case 1: plain <text> node
                text_node = caption.find("text")
                if text_node is not None and text_node.text:
                    label_text = text_node.text.strip()

                # Case 2: <exData> node with HTML
                if label_text is None:
                    exdata = caption.find("exData")
                    if exdata is not None:
                        raw_text = "".join(exdata.itertext())
                        # Collapse whitespace and trim
                        label_text = re.sub(r"\s+", " ", raw_text).strip()

            if label_text:
                options.append(label_text)

        if options:
            fe = super().to_form_element()
            fe.enum = options
            fe.is_radio = True
            return fe
