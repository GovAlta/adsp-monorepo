import re
import xml.etree.ElementTree as ET
from typing import List, Tuple, Iterable

from xdp_parser.control_label import ControlLabels, inline_caption
from xdp_parser.xdp_basic_input import XdpBasicInput
from xdp_parser.xdp_category import XdpCategory
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_radio_selector import XdpRadioSelector, extract_radio_button_labels
from xdp_parser.xdp_utils import remove_duplicates
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_object_array import XdpObjectArray
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_utils import is_hidden, is_subform
from schema_generator.form_element import FormElement


def parse_xdp(tree: ET.Element) -> List[FormElement]:
    categorization = find_categorization(tree)
    categories = parse_categorization(categorization)
    form_elements: List[FormElement] = []
    for category in categories:
        fields = parse_subform(category)
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
    template = next((el for el in root.iter() if el.tag == "template"), None)
    if template is None:
        print("template node not found")
        return []

    subform1 = next((el for el in template if el.tag == "subform"), None)
    if subform1 is None:
        print("first level subform not found")
        return []

    subform2 = next((el for el in subform1 if el.tag == "subform"), None)
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
        if is_potential_container(category):
            categories.append(category)
    return categories


def parse_subform(subform: ET.Element) -> list["XdpElement"]:
    xdp_controls: list["XdpElement"] = []
    control_labels = ControlLabels(subform)

    # Is the subform a radio button collection?
    radio_labels = extract_radio_button_labels(subform)
    if radio_labels:
        xdp_controls.append(XdpRadioSelector(subform, radio_labels))
        return remove_duplicates(xdp_controls)

    # Is the subform a list with detail?
    if is_list_with_detail(subform):
        lwt = parse_list_with_detail(subform, control_labels)
        xdp_controls.append(lwt)
        return remove_duplicates(xdp_controls)

    for form_element in subform:
        control = extract_control(form_element, control_labels)
        if control:
            xdp_controls.append(control)
    return remove_duplicates(xdp_controls)


def parse_list_with_detail(
    lwd_element: ET.Element, control_labels: ControlLabels, max_depth: int = 1
) -> XdpObjectArray:
    name = lwd_element.attrib.get("name") or "Items"

    columns: List["XdpElement"] = []
    for field_node in _iter_leaf_field_nodes(lwd_element, max_depth=max_depth):
        try:
            col = extract_control(field_node, control_labels)
            if col is None:
                continue
            # If your XdpElement has is_leaf, prefer real inputs only
            if getattr(col, "is_leaf", True):
                columns.append(col)
        except Exception:
            # fail-soft: skip any problematic field, keep processing others
            continue

    # Ensure at least one column exists so downstream doesn’t choke
    if not columns:
        # Create a minimal placeholder element via the factory if possible
        # (Assumes factory can handle a synthetic text field; if not, you can raise)
        placeholder = ET.Element("field", {"name": "value"})
        cols_caption = ET.SubElement(placeholder, "caption")
        ET.SubElement(cols_caption, "value").text = "Value"
        maybe = extract_control(placeholder, control_labels)
        if maybe:
            columns.append(maybe)

    return XdpObjectArray(lwd_element, name, columns, control_labels)


def is_list_with_detail(node):
    if _has_repeater_occur(node):
        return True
    fields = _leaf_fields_excluding_buttons(node)
    has_buttons = any(_is_add_remove_button(f) for f in node.findall(".//field"))
    return has_buttons and len(fields) >= 1


def _iter_event_scripts(node: ET.Element) -> Iterable[Tuple[str, str, str]]:
    """
    Yield (eventName, contentType, scriptText) for all <event><script> below node.
    Handles both JavaScript and FormCalc.
    """
    for ev in node.findall(".//event"):
        name = (ev.attrib.get("name") or "").lower()
        sc = ev.find("./script")
        if sc is not None:
            ctype = (sc.attrib.get("contentType") or "").lower()
            text = (sc.text or "").strip()
            if text:
                yield (name, ctype, text)


# ----------------- heuristics -----------------

_ADD_REMOVE_PATTERNS = [
    re.compile(r"\binstanceManager\s*\.\s*addInstance\s*\(", re.I),
    re.compile(r"\binstanceManager\s*\.\s*removeInstance\s*\(", re.I),
    re.compile(r"\binstanceManager\s*\.\s*insertInstance\s*\(", re.I),
    re.compile(r"\binstanceManager\s*\.\s*moveInstance\s*\(", re.I),
    re.compile(r"\bsetInstances\s*\(", re.I),
    re.compile(
        r"xfa\.resolveNode\([^)]*\)\.instanceManager\.(addInstance|removeInstance|insertInstance|moveInstance)\(",
        re.I,
    ),
]

_BUTTON_WORDS = re.compile(r"\b(add|remove|delete|\+|\-)\b", re.I)


def _is_button(field: ET.Element) -> bool:
    # XFA button: <field><ui><button/></ui></field>
    return field.find("./ui/button") is not None


def _button_caption(field: ET.Element) -> str:
    cap = field.find("./caption/value")
    return (cap.text or "").strip() if cap is not None and cap.text else ""


def _is_add_remove_button(field: ET.Element) -> bool:
    """True if it's a button with caption or click script indicating add/remove behavior."""
    if not _is_button(field):
        return False
    if _BUTTON_WORDS.search(_button_caption(field)):
        return True
    for name, _, text in _iter_event_scripts(field):
        if name == "click" and any(p.search(text) for p in _ADD_REMOVE_PATTERNS):
            return True
    return False


def _has_repeater_occur(subform: ET.Element) -> bool:
    """
    True if <occur max> suggests more than one instance.
    Common values: max="-1" (unbounded), or numeric > 1.
    """
    occur = subform.find("./occur")
    if occur is None:
        return False
    maxv = (occur.attrib.get("max") or "").strip().lower()
    if not maxv:
        return False
    if maxv in ("1",):
        return False
    # numeric or 'unbounded' or '-1'
    if maxv in ("unbounded", "-1"):
        return True
    try:
        return int(maxv) > 1
    except ValueError:
        # Unknown string but not "1" => be generous
        return True


def _leaf_fields_excluding_buttons(subform: ET.Element) -> List[ET.Element]:
    """Direct child fields that are not buttons."""
    out = []
    for fld in subform.findall("./field"):
        if not _is_button(fld):
            out.append(fld)
    return out


def _presence_hidden(node: ET.Element) -> bool:
    presence = (node.attrib.get("presence") or "").lower()
    return presence in {"hidden", "invisible"}


def _is_calc_only(field: ET.Element) -> bool:
    # Treat as calc-only if it has a <calculate> but no name and no bind (tweak as needed)
    if field.find("./calculate") is None:
        return False
    has_name = bool(field.attrib.get("name"))
    has_bind = field.find("./bind") is not None
    return not (has_name or has_bind)


def _is_visible_input(field: ET.Element) -> bool:
    if _is_button(field):
        return False
    if _presence_hidden(field):
        return False
    if _is_calc_only(field):
        return False
    return True


def _iter_leaf_field_nodes(row_subform: ET.Element, max_depth: int = 1):
    """
    Yield input <field> nodes within the row subform.
    Scans direct children and (by default) one wrapper level deep.
    """
    # direct fields
    for fld in row_subform.findall("./field"):
        if _is_visible_input(fld):
            yield fld

    if max_depth >= 1:
        # one-level wrapper subforms commonly used for layout
        for wrap in row_subform.findall("./subform"):
            # skip obvious control clusters like Add/Remove if present
            name = (wrap.attrib.get("name") or "").lower()
            if name in {"addremove", "controls", "toolbar"}:
                continue
            for fld in wrap.findall("./field"):
                if _is_visible_input(fld):
                    yield fld


def _subform_label(sf: ET.Element) -> str:
    # Prefer an explicit caption on the subform if present
    cap = sf.find("./caption/value")
    if cap is not None and (cap.text or "").strip():
        return cap.text.strip()

    # Otherwise prettify the name
    n = sf.attrib.get("name") or "Items"
    words = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", n).replace("_", " ").strip()
    return words[:1].upper() + words[1:]


def extract_control(
    form_element: ET.Element, control_labels: ControlLabels
) -> XdpElement | None:
    if form_element.tag == "exclGroup":
        return XdpRadio(form_element, control_labels)
    elif form_element.tag == "field":
        if not is_info_button(form_element) and not is_hidden(form_element):
            # TODO handle the above cases
            return XdpBasicInput(form_element, control_labels)
    elif is_potential_container(form_element):
        nested_controls = parse_subform(form_element)
        if nested_controls and len(nested_controls) > 1:
            label = control_labels.get(form_element.get("name") or "")
            if not label:
                label = inline_caption(form_element)
            return XdpGroup(form_element, nested_controls, label)
        elif nested_controls and len(nested_controls) == 1:
            return nested_controls[0]


def is_potential_container(xdp: ET.Element) -> bool:
    if not is_subform(xdp):
        return False
    # Must have at least one child that potentially has input elements
    for element in xdp:
        if element.tag in ["field", "exclGroup", "subform"]:
            return True
    return False


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
