from typing import List

from xdp_parser.control_labels import ControlLabels
from xdp_parser.xdp_element import XdpElement

debug_help_text = "Section 3-"


def debug_elements(elements: List[XdpElement], labels: ControlLabels, context: str):
    """
    Searches a list of XdpElements for an XdpHelpText node
    containing the given search string.

    Prints matches and returns True if found.
    """

    for i, element in enumerate(elements):
        if element.is_help_text() and element.is_header():
            text = element.help_text()
            name = element.get_name()

            if not text:
                continue

            if debug_help_text in text:
                print(f"[DEBUG] {context} -> {name}")
                print(f"        Text: {text[:80]}...")
                if labels.get(name):
                    print(f"        Label: {labels.get(name)}")
                else:
                    print(f"        Label: <no label found> for {name}")
    return
