from xml.etree import ElementTree as ET
from xdp_parser.control_labels import _label_text_from_node
from xdp_parser.control_labels import inline_caption
from xml.etree import ElementTree as ET
from xdp_parser.control_labels import _label_text_from_node, inline_caption
from xdp_parser.parse_context import ParseContext


def resolve_group_label(subform: ET.Element, context) -> str | None:

    def get_xy(el):
        try:
            y = float(str(el.get("y", "99999")).replace("mm", ""))
        except:
            y = 99999
        try:
            x = float(str(el.get("x", "99999")).replace("mm", ""))
        except:
            x = 99999
        return (y, x)

    def is_control(el):
        tag = el.tag.split("}")[-1].lower()
        return tag in {"field", "exclgroup"}

    def is_label_like_draw(el):
        tag = el.tag.split("}")[-1].lower()
        if tag != "draw":
            return False

        name = (el.get("name") or "").lower()
        text = _label_text_from_node(el) or ""
        clean = text.strip()

        # rule 1: explicit label prefix wins
        if name.startswith("lbl"):
            return True

        # rule 2: fallback heuristics to distinguish labels vs. paragraphs
        if "\n" in clean:
            return False
        if len(clean) > 50:  # too big for a header
            return False
        if any(p in clean for p in [".", ";"]):
            return False

        return True

    children = list(subform)
    if not children:
        return None

    sorted_children = sorted(children, key=get_xy)

    # 1. check first element (must be "label-like")
    first = sorted_children[0]
    if is_label_like_draw(first):
        return _label_text_from_node(first).strip()

    # 2. find first lbl* before first control
    first_control_idx = None
    for i, el in enumerate(sorted_children):
        if is_control(el):
            first_control_idx = i
            break

    if first_control_idx is None:
        return None

    for el in sorted_children[:first_control_idx]:
        if is_label_like_draw(el):
            return _label_text_from_node(el).strip()

    return None
