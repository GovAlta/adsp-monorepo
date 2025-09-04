import xml.etree.ElementTree as ET

from xdp_parser.xdp_basic_input import XdpBasicInput
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_utils import strip_namespace

def xdp_factory(xdp: ET.Element) -> XdpElement:
    match strip_namespace(xdp.tag):
        case "exclGroup":
            return XdpRadio(xdp)
        case "field":
            if xdp.attrib.get("presence") == "hidden":
              return None
            return XdpBasicInput(xdp)
    return None
