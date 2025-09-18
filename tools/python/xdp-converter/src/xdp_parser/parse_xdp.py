from typing import List
import xml.etree.ElementTree as ET

from xdp_parser.xdp_category import XdpCategory
from xdp_parser.xdp_factory import xdp_factory
from xdp_parser.xdp_element import XdpElement

from schema_generator.form_element import FormElement
from xdp_parser.xdp_layout import XdpLayout
from xdp_parser.xdp_radio_selector import XdpRadioSelector, extract_radio_button_labels
from xdp_parser.xdp_utils import strip_namespace


def parse_xdp(tree: ET.Element) -> List[FormElement]:
    categorization = find_categorization(tree)
    categories = parse_categorization(categorization)
    form_elements: List[FormElement] = []
    for category in categories:
        fields = parse_category(category)
        if fields:
            form_elements.append(XdpCategory(category, fields).to_form_element())
    return form_elements


def _find_xdp_elements(subform: ET.Element) -> List[XdpElement]:
    xdp_elements = []
    for xdp_element in subform.findall("./*"):
        tag_no_ns = strip_namespace(xdp_element.tag)
        if tag_no_ns == "field":
            xdp_elements.extend(_find_xdp_elements(xdp_element))
        elif tag_no_ns == "subform":
            labels = extract_radio_button_labels(xdp_element)
            if labels:
                xdp_elements.append(XdpRadioSelector(xdp_element, labels))
            else:
                subsection = _find_xdp_elements(xdp_element)
                if subsection:
                    xdp_elements.append(
                        XdpLayout(xdp_element, "VerticalLayout", subsection)
                    )
                # xdp_elements.extend(subsection)
        else:
            xdp = xdp_factory(xdp_element)
            if xdp:
                xdp_elements.append(xdp)
    return xdp_elements


def find_categorization(tree):
    """
    Finds the <template>/<subform>/<subform> node,
    ignoring namespaces for simplicity, which contains the categories.
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
    # Heuristic: must have at least one child that is a field or exclGroup
    for element in cat:
        tag = strip_namespace(element.tag)
        if tag in ("field", "exclGroup"):
            return True
        if tag == "subform":
            return is_potential_category(element)
    return False


def parse_category(category: ET.Element) -> List[XdpElement]:
    category_elements = []
    labels = extract_radio_button_labels(category)
    if labels:
        category_elements.append(XdpRadioSelector(category, labels))
        return category_elements
    else:
        for element in category.findall(".//*"):
            tag = strip_namespace(element.tag)
            if tag in ("field", "exclGroup"):
                xdp = xdp_factory(element)
                if xdp:
                    category_elements.append(xdp)

    return _remove_duplicates(category_elements)


def _remove_duplicates(elems):
    seen = set()
    results = []
    for e in elems:
        # XdpElement has get_name(); if not, fall back to None
        name = getattr(e, "get_name", lambda: None)()
        if name and name in seen:
            continue
        if name:
            seen.add(name)
        results.append(e)
    return results
