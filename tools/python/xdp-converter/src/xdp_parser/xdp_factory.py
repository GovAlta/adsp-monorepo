import xml.etree.ElementTree as ET

from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_subform import traverse_node
from xdp_parser.xdp_subform import get_subform_label
from xdp_parser.xdp_basic_input import XdpBasicInput
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_radio_selector import extract_radio_button_labels
from xdp_parser.xdp_utils import is_hidden, remove_duplicates


def xdp_factory(node: ET.Element):
    tag = node.tag

    # skip hidden subforms entirely (walker already prunes, but belt & suspenders)
    if tag == "subform" and is_hidden(node):
        # TODO find rule that will show this subform.
        return None

    if tag == "exclGroup":
        return XdpRadio(node)

    if tag == "field":
        if is_info_button(node):
            return None
        if is_hidden(node):
            # TODO handle this case - there must be a Show rule somewhere
            print("    Hiding field ", node.get("name"))
            return None
        return XdpBasicInput(node)

    if tag == "subform":
        children_elems: list["XdpElement"] = []
        for el, inside_excl in traverse_node(node):
            if el.tag == "exclGroup":
                labels = extract_radio_button_labels(el)
                if labels:
                    children_elems.append(XdpRadio(el, labels))
                continue
            if el.tag == "field" and not inside_excl:
                fe = xdp_factory(el)
                if fe:
                    children_elems.append(fe)

        # Optional: dedupe children (by scope/name) if you have a helper
        children_elems = remove_duplicates(children_elems)

        # Optional: compute a human label for the subform (e.g., lblHeader)
        label = get_subform_label(node) or node.get("name")
        return XdpGroup(node, children_elems, label)

    # anything else
    return None


# def xdp_factory(xdp: ET.Element) -> XdpElement | None:
#     # if xdp.get("presence") == "hidden":
#     #     # TODO handle this case
#     #     print(f"Skipping hidden node {xdp.get("name")}")
#     #     return None
#     # if xdp.get("access") == "protected":
#     #     # TODO handle this case
#     #     print(f"Skipping protected node {xdp.get("name")}")
#     #     return None
#     # if is_help_button(xdp.get("name")):
#     #     # TODO handle this case
#     #     print(f"##### Skipping help button {xdp.get("name")}")
#     #     return None

#     match xdp.tag:
#         case "exclGroup":
#             return XdpRadio(xdp)
#         case "field":
#             if not is_info_button(xdp):
#                 return XdpBasicInput(xdp)
#             # else:
#             # TODO create HelpContent ?
#     return None


# import xml.etree.ElementTree as ET


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
