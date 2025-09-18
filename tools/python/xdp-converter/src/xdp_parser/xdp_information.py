import xml.etree.ElementTree as ET
from schema_generator.form_information import FormInformation
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import strip_label_prefix
from schema_generator.form_element import FormElement


class XdpInformation(XdpElement):
    def __init__(self, xdp):
        super().__init__(xdp)

    def _caption(self):
        cap = self.xdp_element.find(".//caption/value")
        return "".join(cap.itertext()).strip() if cap is not None else ""

    def _tooltip(self):
        tip = self.xdp_element.find(".//assist/toolTip/value")
        return "".join(tip.itertext()).strip() if tip is not None else ""

    def get_type(self):
        return "HelpContent"

    def to_form_element(self) -> FormElement:
        fe = FormInformation(self.get_name(), self._tooltip())
        raw_name = self.get_name() or ""
        label_from_name = strip_label_prefix(raw_name) if raw_name else ""
        label_from_caption = self._caption()
        fe.label = label_from_caption or label_from_name or "More info"
        return fe

    def get_name(self):
        return "Information"
