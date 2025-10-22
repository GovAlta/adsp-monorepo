import re
from typing import Dict, List, Optional, Tuple
import xml.etree.ElementTree as ET


def strip_namespace(tag: str) -> str:
    """Remove namespace from XML tag."""
    return tag.split("}")[-1] if "}" in tag else tag


_LABEL_PREFIXES = ["txt", "btn", "chk", "dte", "lbl", "cbo", "rb"]


def strip_label_prefix(label: str) -> str:
    for prefix in _LABEL_PREFIXES:
        if label.lower().startswith(prefix.lower()):
            return label[len(prefix) :]
    return label


def split_camel_case(s: str) -> str:
    """Split a camel case string into separate words, keeping acronyms intact, and splitting before numbers."""
    # Insert space before capital letters that follow lowercase letters and are followed by lowercase (e.g. FredIs -> Fred Is)
    s = re.sub(r"(?<=[a-z])(?=[A-Z][a-z])", " ", s)
    # Insert space before acronym sequences if preceded by lowercase (e.g. myHTTP -> my HTTP)
    s = re.sub(r"(?<=[a-z])(?=[A-Z]{2,})", " ", s)
    # Insert space before numbers if preceded by letters (e.g. Is100 -> Is 100)
    s = re.sub(r"(?<=[a-zA-Z])(?=\d)", " ", s)
    return s


def remove_duplicates(seq):
    seen = set()
    return [x for x in seq if not (x in seen or seen.add(x))]


def name_to_scope(name: str) -> Optional[str]:
    # naive: assume identical names map to data properties
    return f"#/properties/{name}"


# best-effort type cast
def string_to_number(raw: str) -> str | int | float:
    try:
        val = int(raw)
    except ValueError:
        try:
            val = float(raw)
        except ValueError:
            val = raw  # keep as string if not numeric
    return val


_EXTRACT_NOT = re.compile(r"^\s*NOT\((.*)\)\s*$")


def strip_not(cond: str) -> Tuple[str, bool]:
    m = _EXTRACT_NOT.match(cond or "")
    if m:
        return m.group(1).strip(), True
    return (cond or "").strip(), False


def tag_name(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def node_name(el: Optional[ET.Element]) -> Optional[str]:
    if el is None:
        return None
    return el.attrib.get("name") or el.attrib.get("id") or tag_name(el.tag)


def strip_namespaces(elem):
    for el in elem.iter():
        if el.tag.startswith("{"):
            el.tag = el.tag.split("}", 1)[1]  # keep localname only
    return elem


def is_help_button(name: str) -> bool:
    """
    Returns True if the string matches the pattern: btn<anything>Help<anything>,
    a heuristic to help recognize "information" buttons.
    """
    return bool(re.match(r"^btn.*Help.*$", name))


def remove_duplicates(elems):
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


def is_hidden(node):
    return node.get("presence", "").lower() == "hidden"


def is_subform(el: ET.Element) -> bool:
    return el.tag == "subform"


def is_button(field: ET.Element) -> bool:
    # XFA button: <field><ui><button/></ui></field>
    return field.find("./ui/button") is not None


def non_button_inputs(sf: ET.Element) -> List[ET.Element]:
    return [f for f in sf.findall("./field") if not is_button(f)]


def has_repeater_occur(subform: ET.Element) -> bool:
    occur = subform.find("./occur")
    if occur is None:
        return False
    maxv = (occur.attrib.get("max") or "").strip().lower()
    if not maxv or maxv == "1":
        return False
    if maxv in ("-1", "unbounded"):
        return True
    try:
        return int(maxv) > 1
    except ValueError:
        return True


def build_parent_map(root) -> Dict[ET.Element, Optional[ET.Element]]:
    parent_map: Dict[ET.Element, Optional[ET.Element]] = {root: None}
    for parent in root.iter():
        for child in parent:
            parent_map[child] = parent
    return parent_map


def presence_hidden(node: ET.Element) -> bool:
    presence = (node.attrib.get("presence") or "").lower()
    return presence in {"hidden", "invisible"}


def get_field_caption(field: ET.Element) -> Optional[ET.Element]:
    caption = field.find(".//caption/value")
    if caption is not None:
        # Case 1: plain <text> node
        text_node = caption.find("text")
        if text_node is not None and text_node.text:
            return text_node.text.strip()

        # Case 2: <exData> node with HTML
        exdata = caption.find("exData")
        if exdata is not None:
            raw_text = "".join(exdata.itertext())
            # Collapse whitespace and trim
            return re.sub(r"\s+", " ", raw_text).strip()
    return None
