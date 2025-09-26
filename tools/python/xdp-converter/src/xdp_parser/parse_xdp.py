from typing import List
import xml.etree.ElementTree as ET

from xdp_parser.xdp_category import XdpCategory
from schema_generator.form_element import FormElement
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_factory import xdp_factory
from xdp_parser.xdp_radio_selector import XdpRadioSelector, extract_radio_button_labels
from xdp_parser.xdp_utils import remove_duplicates


def parse_xdp(tree: ET.Element) -> List[FormElement]:
    categorization = find_categorization(tree)
    categories = parse_categorization(categorization)
    form_elements: List[FormElement] = []
    for category in categories:
        fields = parse_category(category)
        # No fields => nothing to input => no category.
        # Should we be looking for a category (page) that just contains help text
        # as well?
        if fields:
            form_elements.append(XdpCategory(category, fields).to_form_element())
    return form_elements


def find_categorization(tree):
    """
    Finds the <template>/<subform>/<subform> node which contains the categories.
    """
    root = tree.getroot()

    # Look for the first "template" node anywhere in the tree
    template = next((el for el in root.iter() if el.tag.endswith("template")), None)
    if template is None:
        print("template node not found")
        return []

    subform1 = next((el for el in template if el.tag.endswith("subform")), None)
    if subform1 is None:
        print("first level subform not found")
        return []

    subform2 = next((el for el in subform1 if el.tag.endswith("subform")), None)
    if subform2 is None:
        print("second level subform not found")
        return []

    return subform2


def parse_categorization(categorization):
    """
    Returns a list of first-level <subform> elements;
    These elements contain a logical set of inputs grouped as a category.
    """
    categories = []
    for category in categorization:
        if is_potential_category(category):
            categories.append(category)
    return categories


def is_potential_category(cat: ET.Element) -> bool:
    if not cat.tag.endswith("subform"):
        return False
    # Heuristic: must have at least one child that is an input element
    # (field or exclGroup)
    for element in cat:
        if element.tag in ["field", "exclGroup"]:
            return True
    return False


import xml.etree.ElementTree as ET
from typing import List

# decide whether to keep the hidden subform visible to outer logic:
# - True  -> yield the hidden subform node (so you can still attach rules), but don't descend
# - False -> skip the hidden subform entirely (neither yield nor descend)
YIELD_HIDDEN_SUBFORM_NODE = True


def _is_hidden_subform(el: ET.Element) -> bool:
    # presence="hidden" => treat as hidden
    return el.tag == "subform" and (el.get("presence", "").lower() == "hidden")


def _traverse_category(root: ET.Element):
    """
    Yield (element, inside_excl) for all descendants of `root`.
      - On exclGroup: yield once with inside_excl=True, do NOT descend.
      - On hidden subform: yield once (configurable), do NOT descend.
      - Otherwise: yield and continue descending.
    """
    for child in list(root):
        if child.tag == "exclGroup":
            yield child, True
            continue

        if _is_hidden_subform(child):
            if YIELD_HIDDEN_SUBFORM_NODE:
                yield child, False
            # in all cases: do NOT descend into hidden subform
            continue

        # normal element
        yield child, False
        yield from _traverse_category(child)


def parse_category(category: ET.Element) -> List["XdpElement"]:
    out: List["XdpElement"] = []

    # 1) Whole category acts like a radio wrapper? (e.g., a single exclGroup’s worth of radios)
    labels = extract_radio_button_labels(category)
    if labels:
        out.append(XdpRadioSelector(category, labels))
        return remove_duplicates(out)

    # 2) Walk subtree with pruning
    for el, inside_excl in _traverse_category(category):
        if el.tag == "exclGroup":
            labels = extract_radio_button_labels(el)
            xdp = XdpRadioSelector(el, labels) if labels else xdp_factory(el)
            if xdp:
                out.append(xdp)
            # children were intentionally not traversed
            continue

        if el.tag == "field" and not inside_excl:
            # ordinary field (not inside exclGroup, and not inside hidden subform due to pruning)
            xdp = xdp_factory(el)
            if xdp:
                out.append(xdp)

        # Optional: if you want to surface visible subforms as containers, handle here
        # elif el.tag == "subform" and not _is_hidden_subform(el):
        #     maybe_wrap = xdp_factory(el)
        #     if maybe_wrap:
        #         out.append(maybe_wrap)

    return remove_duplicates(out)
