import xml.etree.ElementTree as ET

from xdp_parser.xdp_basic_input import XdpBasicInput
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_radio import XdpRadio


def xdp_factory(xdp: ET.Element) -> XdpElement | None:
    # if xdp.get("presence") == "hidden":
    #     # TODO handle this case
    #     print(f"Skipping hidden node {xdp.get("name")}")
    #     return None
    # if xdp.get("access") == "protected":
    #     # TODO handle this case
    #     print(f"Skipping protected node {xdp.get("name")}")
    #     return None
    # if is_help_button(xdp.get("name")):
    #     # TODO handle this case
    #     print(f"##### Skipping help button {xdp.get("name")}")
    #     return None

    match xdp.tag:
        case "exclGroup":
            return XdpRadio(xdp)
        case "field":
            if is_info_button(xdp):
                # TODO create HelpContent ?
                print("Found info button")
            else:
                return XdpBasicInput(xdp)
    return None


import xml.etree.ElementTree as ET


def is_info_button(field: ET.Element) -> bool:
    """
    Return True if the given <field> is an 'information button':
      - field @name starts with 'btn'
      - caption text (after stripping) equals 'i'
    """
    name = field.get("name", "")
    if not name.startswith("btn"):
        return False

    # look for <caption>/<value>/<text> or <caption>/<value>/<exData>
    caption = field.find(".//caption/value")
    if caption is None:
        return False

    # text node
    if caption.find("text") is not None and caption.find("text").text:
        return caption.find("text").text.strip() == "i"

    # exData node (plain text only, ignore formatting)
    exdata = caption.find("exData")
    if exdata is not None and exdata.text:
        return exdata.text.strip() == "i"

    # Sometimes value itself has text
    if caption.text and caption.text.strip() == "i":
        return True

    return False
