import xml.etree.ElementTree as ET
from xdp_parser.xdp_utils import is_hidden, is_subform, tag_name


def get_subform_label(subform) -> str | None:
    """
    Find the title for a <subform>.
    Preference order:
    1) direct child <draw name="lblHeader"> (strongest signal)
    2) any descendant  <draw name="lblHeader"> (nearest is ok)
    3) fallback: first <draw> that has a non-empty <value>/<text>
    Returns the label string or None.
    """
    # 1) prefer a direct child draw named lblHeader
    for child in list(subform):
        if tag_name(child.tag).lower() != "draw":
            continue
        name_attr = child.attrib.get("name") or ""
        if name_attr.lower() == "lblheader":
            txt = text_of_value(child)
            if txt:
                return txt

    # 2) else, any descendant draw named lblHeader (first hit wins)
    for d in subform.iter():
        if tag_name(d.tag).lower() != "draw":
            continue
        name_attr = d.attrib.get("name") or ""
        if name_attr.lower() == "lblheader":
            txt = text_of_value(d)
            if txt:
                return txt

    # 3) fallback: first draw with usable <value>/<text>
    for d in subform.iter():
        if tag_name(d.tag).lower() != "draw":
            continue
        txt = text_of_value(d)
        if txt:
            return txt

    return None


def traverse_node(node: ET.Element):
    """
    Yield (element, inside_excl) for all descendants of `root`.
      - On exclGroup: yield once with inside_excl=True, do NOT descend.
      - On hidden subform: yield once (configurable), do NOT descend.
      - Otherwise: yield and continue descending.
    """

    for child in list(node):
        if child.tag == "exclGroup":
            yield child, True
            continue

        if is_subform(node) and is_hidden(node):
            # TODO handle this - descend AND create a rule that hides the subform.
            print(f"     subform {child.get('name') } is being ignored")
            continue

        # normal element
        yield child, False
        yield from traverse_node(child)


def text_of_value(draw_el: ET.Element) -> str:
    """
    Extract text from a <value> under <draw>, looking for any <text> child first,
    otherwise the direct text content of <value>.
    """
    # handle namespaces generically by checking local-names
    for child in draw_el:
        if tag_name(child.tag).lower() == "value":
            # prefer nested <text>
            for g in child.iter():
                if tag_name(g.tag).lower() == "text" and (g.text and g.text.strip()):
                    return g.text.strip()
            # else raw value text
            if child.text and child.text.strip():
                return child.text.strip()
            break
    return ""
