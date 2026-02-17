import xml.etree.ElementTree as ET
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import convert_to_mm

# ----------------------------
# Tuning knobs (start here)
# ----------------------------
# Tuning knobs (keep them obvious and few)
HEADER_MIN_SPAN_RATIO = 0.60  # must span 60% of container width
HEADER_MAX_HEIGHT_MM = 12.0  # avoid multi-line instruction blocks


def strip_header_element(
    elements: list[XdpElement],
    header_index: int | None,
) -> list[XdpElement]:
    """
    Returns a new list with the header removed
    if header_index is valid.
    """
    if header_index is None:
        return elements
    if header_index < 0 or header_index >= len(elements):
        return elements
    return elements[:header_index] + elements[header_index + 1 :]


def promote_group_headers(
    subform: ET.Element,
    elements: list[XdpElement],
    debug: bool = False,
):
    if not elements:
        return

    if debug:
        sub_name = subform.get("name") or "<?>"
        print(f"\n[DEBUG] Find header for {sub_name}, ({len(elements)} elements)")

    first = elements[0]
    if not first.is_help_text():
        if debug:
            print("  First element is not help text")
        return

    text = (getattr(first, "text", None) or "").strip()
    if not text:
        if debug:
            print("  First element has no text")
        return

    first.promote_to_header()
    if debug:
        print(f"  Header is '{text}'")
    return
