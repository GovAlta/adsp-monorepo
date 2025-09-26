import traceback
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
            if xdp.get("name") == "rbVehicleIs":
                print("exclGroup rbVehicleIs found ##############")
            #                traceback.print_stack()
            return XdpRadio(xdp)
        case "field":
            if xdp.get("name") == "SAOwned":
                print("Field SAOwned found ##############")
            #                traceback.print_stack()
            return XdpBasicInput(xdp)
    return None
