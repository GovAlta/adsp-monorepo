import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional

from xdp_parser.display_text import DisplayText
from xdp_parser.xdp_utils import has_repeater_occur, is_button


def is_object_array(node):
    if node.find("./occur") is not None:
        return True

    # Existing fallback
    if has_repeater_occur(node):
        return True

    fields = _leaf_fields_excluding_buttons(node)
    has_buttons = any(_is_add_remove_button(f) for f in node.findall(".//field"))
    return has_buttons and len(fields) >= 1


def find_click_events(node):
    for ev in node.findall(".//event"):
        name = (ev.attrib.get("name") or "").lower()
        activity = (ev.attrib.get("activity") or "").lower()
        if "click" in name or activity == "click":
            sc = ev.find("./script")
            if sc is not None:
                ctype = (sc.attrib.get("contentType") or "").lower()
                text = (sc.text or "").strip() or ""
                if text:
                    yield (activity or name or "click", ctype, text)


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


def _button_caption(field: ET.Element) -> str:
    cap = field.find("./caption/value")
    return (cap.text or "").strip() if cap is not None and cap.text else ""


def _is_add_remove_button(field: ET.Element) -> bool:
    """True if it's a button with caption or click script indicating add/remove behavior."""
    if not is_button(field):
        return False
    if _BUTTON_WORDS.search(_button_caption(field)):
        return True
    for name, _, text in find_click_events(field):
        if name == "click" and any(p.search(text) for p in _ADD_REMOVE_PATTERNS):
            return True
    return False


def _leaf_fields_excluding_buttons(subform: ET.Element) -> List[ET.Element]:
    """Direct child fields that are not buttons."""
    out = []
    for fld in subform.findall("./field"):
        if not is_button(fld):
            out.append(fld)
    return out


IM_TARGET_PAT = re.compile(
    r"(?:([A-Za-z_]\w*)\s*\.\s*instanceManager\.(?:addInstance|removeInstance|insertInstance|moveInstance)\s*\()"
    r'|(?:xfa\.resolveNode\(\s*"([^"]+)"\s*\)\.instanceManager\.(?:addInstance|removeInstance|insertInstance|moveInstance)\s*\()',
    re.I,
)

# 2) Parse relative parent hops like "this.parent.parent.instanceManager.addInstance("
REL_PARENT_HOPS_PAT = re.compile(
    r"\bthis((?:\s*\.\s*parent)+)\s*\.instanceManager\.(?:addInstance|removeInstance|insertInstance|moveInstance)\s*\(",
    re.I,
)


def collect_explicit_targets(button_field: ET.Element) -> List[str]:
    targets = []
    for evt, _, text in find_click_events(button_field):
        if evt != "click":
            continue
        for m in IM_TARGET_PAT.finditer(text):
            dotted_name, som_path = m.groups()
            if dotted_name:
                targets.append(dotted_name.strip())
            elif som_path:
                targets.append(som_path.strip())
    return targets


def count_parent_hops(button_field: ET.Element) -> int:
    hops = 0
    for evt, _, text in find_click_events(button_field):
        if evt != "click":
            continue
        m = REL_PARENT_HOPS_PAT.search(text)
        if m:
            chain = m.group(1)  # like ".parent.parent"
            hops = max(hops, chain.count("parent"))
    return hops


def ancestor_by_hops(
    node: ET.Element, parent_map: Dict[ET.Element, ET.Element], hops: int
) -> Optional[ET.Element]:
    cur = node
    for _ in range(hops):
        cur = parent_map.get(cur)
        if cur is None:
            return None
    return cur


def split_label_and_help(label_text, min_space_count=2) -> DisplayText:
    """
    Splits label_text into (label, help_text) using min_space_count consecutive spaces as separator.
    Returns (label, help_text). If no separator found, help_text is ''.
    """
    # Build regex for min_space_count spaces
    pattern = r"\s{" + str(min_space_count) + r",}"
    parts = re.split(pattern, label_text, maxsplit=1)
    if len(parts) == 2:
        return DisplayText(parts[0].strip(), parts[1].strip())
    else:
        return DisplayText(label_text.strip(), "")
