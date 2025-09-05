import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple, Set
import re


def _local(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _text_of(el: ET.Element) -> str:
    return (el.text or "").strip()


def _gather_label_text(field_el: ET.Element) -> str:
    """
    Try to find a human label for a field:
    - <caption> under the field
    - <items>/<text> under the field
    - any descendant <text> nodes
    Returns first non-empty hit.
    """
    # walk descendants & check local tag names manually
    for desc in field_el.iter():
        ln = _local(desc.tag).lower()
        if ln == "caption" and _text_of(desc):
            return _text_of(desc)
    for desc in field_el.iter():
        ln = _local(desc.tag).lower()
        if ln == "items":
            # look for <text> beneath items
            for dd in desc.iter():
                if _local(dd.tag).lower() == "text" and _text_of(dd):
                    return _text_of(dd)
    for desc in field_el.iter():
        if _local(desc.tag).lower() == "text" and _text_of(desc):
            return _text_of(desc)
    return ""


def _find_excl_groups(root: ET.Element) -> Dict[str, Dict[str, str]]:
    """
    Return: { group_name: { member_field_name: label } } using <exclGroup>.
    """
    out: Dict[str, Dict[str, str]] = {}
    for ex in root.iter():
        if _local(ex.tag) != "exclGroup":
            continue
        gname = ex.attrib.get("name") or "radioGroup"
        group: Dict[str, str] = {}
        # iterate descendants; pick <field> elements
        for fld in ex.iter():
            if _local(fld.tag) != "field":
                continue
            fname = fld.attrib.get("name")
            if not fname:
                continue
            label = _gather_label_text(fld) or fname
            group[fname] = label
        # keep only if there are at least two options
        if len(group) >= 2:
            out[gname] = group
    return out


def _is_round_checkbutton(fld: ET.Element) -> bool:
    # look for a descendant <checkButton> and read its shape
    for d in fld.iter():
        if _local(d.tag) == "checkButton":
            shape = (d.attrib.get("shape") or "").lower()
            return shape in {"round", "circle"}
    return False


_UNCHECK_RE = re.compile(r"\b([A-Za-z_]\w*)\s*\.rawValue\s*=\s*0\b")


def _collect_uncheck_targets(script_text: str) -> Set[str]:
    return set(_UNCHECK_RE.findall(script_text or ""))


def _iter_scripts_in(container: ET.Element) -> List[str]:
    out: List[str] = []
    for s in container.iter():
        if _local(s.tag) == "script":
            txt = (s.text or "").strip()
            if txt:
                out.append(txt)
    return out


def detect_radio_like_clusters(root: ET.Element) -> Dict[str, Dict[str, str]]:
    """
    Heuristic radios (no <exclGroup>): find <subform> containers that
    have 2+ fields with round checkButtons and scripts that uncheck others.
    Returns: { group_name: { member_field_name: label } }
    """
    clusters: Dict[str, Dict[str, str]] = {}

    for container in root.iter():
        if _local(container.tag) != "subform":
            continue

        # collect direct/descendant fields in this container
        fields: List[ET.Element] = [
            f for f in container.iter() if _local(f.tag) == "field"
        ]
        round_fields = [f for f in fields if _is_round_checkbutton(f)]
        if len(round_fields) < 2:
            continue

        # look for "uncheck others" pattern across container scripts
        scripts = "\n".join(_iter_scripts_in(container))
        uncheck_targets = _collect_uncheck_targets(scripts)
        member_names = [
            f.attrib.get("name") for f in round_fields if f.attrib.get("name")
        ]

        # heuristic: at least one other member is being cleared somewhere
        has_cross_uncheck = len(uncheck_targets.intersection(set(member_names))) >= 1
        if not has_cross_uncheck:
            continue

        gname = container.attrib.get("name") or "RadioGroup"
        group: Dict[str, str] = {}
        for fld in round_fields:
            fname = fld.attrib.get("name")
            if not fname:
                continue
            lbl = _gather_label_text(fld) or fname
            group[fname] = lbl

        if len(group) >= 2:
            clusters[gname] = group

    return clusters


def build_choice_groups(
    root: ET.Element,
) -> Tuple[Dict[str, Dict[str, str]], Dict[str, str]]:
    """
    Return:
      group_to_label: { group_name: { member_field: label } }
      member_to_group: { member_field: group_name }
    Combines true <exclGroup> groups and heuristic radio-like clusters.
    """
    group_to_label = _find_excl_groups(root)

    # add heuristic clusters where no explicit exclGroup is present for that container name
    heur = detect_radio_like_clusters(root)
    for g, mapping in heur.items():
        group_to_label.setdefault(g, mapping)

    member_to_group: Dict[str, str] = {}
    for g, mapping in group_to_label.items():
        for member in mapping:
            member_to_group[member] = g
    return group_to_label, member_to_group
