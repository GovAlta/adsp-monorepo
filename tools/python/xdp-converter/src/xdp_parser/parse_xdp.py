from typing import List
import xml.etree.ElementTree as ET

from xdp_parser.xdp_category import XdpCategory
from schema_generator.form_element import FormElement
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_factory import xdp_factory
from xdp_parser.xdp_radio_selector import XdpRadioSelector, extract_radio_button_labels
from xdp_parser.xdp_subform import traverse_node
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


def parse_category(category: ET.Element) -> list["XdpElement"]:
    nodes: list["XdpElement"] = []

    # whole-category radio wrapper?
    labels = extract_radio_button_labels(category)
    if labels:
        nodes.append(XdpRadioSelector(category, labels))
        return remove_duplicates(nodes)

    for el in category:
        if el.tag == "exclGroup":
            fe = xdp_factory(el)  # radio selector or None
            if fe:
                nodes.append(fe)
            continue
        if el.tag == "field":
            fe = xdp_factory(el)
            if fe:
                nodes.append(fe)
        if el.tag == "subform":
            print(f"category: {category.get('name')}, subform {el.get('name')}")
            fe = xdp_factory(el)  # XdpGroup
            if fe:
                nodes.append(fe)

    return remove_duplicates(nodes)
