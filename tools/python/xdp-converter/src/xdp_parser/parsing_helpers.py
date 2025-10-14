import re
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple, Iterable


def is_object_array(node):
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


def _non_button_inputs(sf: ET.Element) -> List[ET.Element]:
    return [f for f in sf.findall("./field") if not _is_button(f)]


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


def is_add_remove_controls_subform(
    subform: ET.Element, root: ET.Element, parent_map: Dict[ET.Element, ET.Element]
) -> bool:
    """
    True if 'subform' is a controls-only block for some repeating row subform,
    regardless of adjacency.
    """
    # Must have at least one add/remove button
    buttons = [f for f in subform.findall("./field") if _is_add_remove_button(f)]
    if not buttons:
        return False

    # Must NOT contain real inputs of its own
    if _non_button_inputs(subform):
        return False

    # 1) Try explicit targets (names or SOM paths)
    for btn in buttons:
        for target in _collect_explicit_targets(btn):
            node = None
            if "/" in target:
                node = _resolve_som_path(root, target)
            else:
                node = _resolve_name_in_scope(root, subform, target)
            if node is not None and is_object_array(node):
                return True  # clear link to a real row

    # 2) Try relative parent hops
    # Find the maximum hops among buttons (conservative)
    hops = max((_count_parent_hops(b) for b in buttons), default=0)
    if hops > 0:
        # Resolve from each button independently; if any lands on a row, we're good
        for b in buttons:
            bhops = _count_parent_hops(b)
            ancestor = _ancestor_by_hops(b, parent_map, bhops)
            if ancestor is not None and is_object_array(ancestor):
                return True
            # Some authors do "this.parent.parent" then target the row as a child of that ancestor:
            if ancestor is not None:
                # look for any repeating subform descendant
                for cand in ancestor.findall(".//subform"):
                    if is_object_array(cand):
                        return True

    # 3) Name hint only (bonus): looks like controls, and we already verified it has buttons and no inputs
    name = subform.attrib.get("name") or ""
    if re.match(r"^(add(remove)?|controls?|toolbar|buttons?)", name, re.I):
        return True

    return False

    # 1) Parse explicit targets (dotted or resolveNode("path"))


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


def _collect_explicit_targets(button_field: ET.Element) -> List[str]:
    targets = []
    for evt, _, text in _iter_event_scripts(button_field):
        if evt != "click":
            continue
        for m in IM_TARGET_PAT.finditer(text):
            dotted_name, som_path = m.groups()
            if dotted_name:
                targets.append(dotted_name.strip())
            elif som_path:
                targets.append(som_path.strip())
    return targets


def _count_parent_hops(button_field: ET.Element) -> int:
    hops = 0
    for evt, _, text in _iter_event_scripts(button_field):
        if evt != "click":
            continue
        m = REL_PARENT_HOPS_PAT.search(text)
        if m:
            chain = m.group(1)  # like ".parent.parent"
            hops = max(hops, chain.count("parent"))
    return hops


def _resolve_name_in_scope(
    root: ET.Element, scope: ET.Element, name: str
) -> Optional[ET.Element]:
    """
    Resolve a simple subform name under current scope, falling back to the whole document.
    """
    # prefer nearest descendant with that name
    for sf in scope.findall(".//subform"):
        if (sf.attrib.get("name") or "") == name:
            return sf
    # fallback: any subform in doc
    for sf in root.findall(".//subform"):
        if (sf.attrib.get("name") or "") == name:
            return sf
    return None


def _resolve_som_path(root: ET.Element, som: str) -> Optional[ET.Element]:
    """
    Minimal SOM-ish resolver: handle absolute-ish "a/b/c" paths by name segments.
    Good enough for most authoring patterns.
    """
    parts = [p for p in som.strip("/").split("/") if p]
    if not parts:
        return None
    # start from root
    cur = root
    for part in parts:
        nxt = None
        for sf in cur.findall("./subform"):
            if (sf.attrib.get("name") or "") == part:
                nxt = sf
                break
        if nxt is None:
            # search deeper if direct child not found
            matches = [
                sf
                for sf in cur.findall(".//subform")
                if (sf.attrib.get("name") or "") == part
            ]
            if not matches:
                return None
            nxt = matches[0]
        cur = nxt
    return cur


def _ancestor_by_hops(
    node: ET.Element, parent_map: Dict[ET.Element, ET.Element], hops: int
) -> Optional[ET.Element]:
    cur = node
    for _ in range(hops):
        cur = parent_map.get(cur)
        if cur is None:
            return None
    return cur


def extract_radio_button_labels(subform_elem):
    """
    Returns a list of radio button labels found in the subform.
    Looks for <field> with <checkButton mark="circle">, then finds the next <draw> and extracts its label.
    """
    children = list(subform_elem)
    labels = []
    i = 0
    while i < len(children):
        child = children[i]
        if child.tag == "field":
            has_radio = any(
                cb.tag == "checkButton" and cb.attrib.get("mark") == "circle"
                for cb in child.iter()
            )
            if has_radio:
                j = i + 1
                while j < len(children):
                    next_elem = children[j]
                    if next_elem.tag == "draw":
                        label = find_button_label(next_elem)
                        if label:
                            labels.append(label[0])
                        break
                    j += 1
        i += 1

    return labels


def find_button_label(draw):
    value_elem = None
    for elem in draw:
        if elem.tag.endswith("value"):
            value_elem = elem
            break
    if value_elem is not None:
        text_elem = None
        for elem in value_elem:
            if elem.tag.endswith("text"):
                text_elem = elem
                break
        if text_elem is not None and text_elem.text:
            return split_label_and_help(text_elem.text.strip())


def split_label_and_help(label_text, min_space_count=2):
    """
    Splits label_text into (label, help_text) using min_space_count consecutive spaces as separator.
    Returns (label, help_text). If no separator found, help_text is ''.
    """
    # Build regex for min_space_count spaces
    pattern = r"\s{" + str(min_space_count) + r",}"
    parts = re.split(pattern, label_text, maxsplit=1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    else:
        return label_text.strip(), ""
