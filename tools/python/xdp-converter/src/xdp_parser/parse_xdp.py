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


# def parse_category(category: ET.Element) -> List[XdpElement]:
#     category_elements = []
#     # if the radio buttons have lots of help text surrounding them
#     # they get embedded in a Subsection rather than an exclGroup
#     # container.  Should they be treated as a category
#     # in such a case?
#     labels = extract_radio_button_labels(category)
#     if labels:
#         category_elements.append(XdpRadioSelector(category, labels))
#         return category_elements
#     else:
#         ## Ack!  Is this right?  It finds fields in an excl group and
#         ## processes them separately, as duplicate inputs.
#         for element in category.findall(".//*"):
#             # traceback.print_stack()
#             # input elements are found in categories or exclGroups (radio buttons)
#             if element.tag in ("field", "exclGroup"):
#                 xdp = xdp_factory(element)
#                 if xdp:
#                     category_elements.append(xdp)


#     return _remove_duplicates(category_elements)
def _collect_pruning_exclgroup(root: ET.Element):
    results = []
    stack = [(root, False)]
    while stack:
        node, inside_excl = stack.pop()
        for child in list(node):
            if child.tag == "exclGroup":
                results.append((child, True))
                # do NOT push its children
                continue
            results.append((child, inside_excl))
            stack.append((child, inside_excl))
    return results


def parse_category(category: ET.Element) -> List["XdpElement"]:
    out: List["XdpElement"] = []

    labels = extract_radio_button_labels(category)
    if labels:
        out.append(XdpRadioSelector(category, labels))
        return remove_duplicates(out)

    for el, inside_excl in _collect_pruning_exclgroup(category):
        if el.tag == "exclGroup":
            labels = extract_radio_button_labels(el)
            xdp = XdpRadioSelector(el, labels) if labels else xdp_factory(el)
            if xdp:
                out.append(xdp)
        elif el.tag == "field" and not inside_excl:
            xdp = xdp_factory(el)
            if xdp:
                out.append(xdp)

    return remove_duplicates(out)
