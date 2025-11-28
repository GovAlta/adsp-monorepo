from asyncio import events
import re
from xml.etree import ElementTree as ET
from typing import Dict, Optional

from xdp_parser.parsing_helpers import (
    collect_explicit_targets,
    ancestor_by_hops,
    count_parent_hops,
    find_click_events,
)
from xdp_parser.xdp_utils import has_repeater_occur, is_button, non_button_inputs


def _is_add_remove_button(field: ET.Element) -> bool:
    if not is_button(field):
        return False

    click_events = [e for _, _, e in find_click_events(field)]

    # Match any add/remove/insert/move instance operation
    event_operators = r"(addInstance|removeInstance|insertInstance|moveInstance)\s*\("

    return any(
        re.search(event_operators, ce, re.I)
        or re.search(r"\bsetInstances\s*\(", ce, re.I)
        for ce in click_events
    )


def is_row_subform(node: ET.Element) -> bool:
    # allow single-field rows
    has_buttons = any(_is_add_remove_button(f) for f in node.findall(".//field"))
    fields = non_button_inputs(node)
    return (has_repeater_occur(node) or has_buttons) and len(fields) >= 1


# 1) Parse explicit targets (dotted or resolveNode("path"))
IM_TARGET_PAT = re.compile(
    r"(?:([A-Za-z_]\w*)\s*\.\s*instanceManager\.(?:addInstance|removeInstance|insertInstance|moveInstance)\s*\()"
    r'|(?:xfa\.resolveNode\(\s*"([^"]+)"\s*\)\.instanceManager\.(?:addInstance|removeInstance|insertInstance|moveInstance)\s*\()',
    re.I,
)

# 2) Parse relative parent hops like "this.parent.parent.instanceManager.addInstance("
REL_PARENT_HOPS_PAT = re.compile(
    r"\bthis((?:\s*\.\s*parent)+)\s*\.instanceManager\.(?:addInstance|removeInstance|insertInstance|moveInstance)\s*\(",
)


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


def is_sibling_container(
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
    if non_button_inputs(subform):
        return False

    # 1) Try explicit targets (names or SOM paths)
    for btn in buttons:
        for target in collect_explicit_targets(btn):
            node = None
            if "/" in target:
                node = _resolve_som_path(root, target)
            else:
                node = _resolve_name_in_scope(root, subform, target)
            if node is not None and is_row_subform(node):
                return True  # clear link to a real row

    # 2) Try relative parent hops
    # Find the maximum hops among buttons (conservative)
    hops = max((count_parent_hops(b) for b in buttons), default=0)
    if hops > 0:
        # Resolve from each button independently; if any lands on a row, we're good
        for button in buttons:
            button_hops = count_parent_hops(button)
            anc = ancestor_by_hops(button, parent_map, button_hops)
            if anc is not None and is_row_subform(anc):
                return True
            # Some authors do "this.parent.parent" then target the row as a child of that ancestor:
            if anc is not None:
                # look for any repeating subform descendant
                for candidate in anc.findall(".//subform"):
                    if is_row_subform(candidate):
                        return True

    # 3) Name hint only (bonus): looks like controls, and we already verified it has buttons and no inputs
    name = subform.attrib.get("name") or ""
    if re.match(r"^(add(remove)?|controls?|toolbar|buttons?)", name, re.I):
        return True

    return False


def is_child_container(sf: ET.Element) -> bool:
    """
    Returns True if `sf` is a subform containing ONLY Add/Remove buttons,
    regardless of nesting inside a row or beside it.
    """

    # Optional hint
    name = (sf.attrib.get("name") or "").lower()
    # name_hint = bool(re.match(r"^(addremove|controls?|toolbar|buttons?)", name))

    fields = sf.findall("./field")
    if not fields:
        return False

    # Split fields into buttons vs real inputs
    button_fields = [f for f in fields if _is_add_remove_button(f)]
    real_inputs = [f for f in fields if not _is_add_remove_button(f)]

    # Must have at least one button
    if len(button_fields) == 0:
        return False

    # Must NOT have any non-button inputs
    if len(real_inputs) > 0:
        return False

    # This is a pure button block → success
    return True


def is_add_remove_container(
    sf: ET.Element, root: ET.Element, parent_map: Dict[ET.Element, ET.Element]
) -> bool:
    """
    Unified detector for all forms of Add/Remove control blocks.
    Delegates to both the original (sibling container) detector and
    the new (embedded controls-only subform) detector.
    """

    # Buttons embedded directly inside row subform
    if is_child_container(sf):
        return True

    # Buttons in sibling control block
    if is_sibling_container(sf, root, parent_map):
        return True

    return False
