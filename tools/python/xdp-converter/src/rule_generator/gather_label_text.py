import re
import xml.etree.ElementTree as ET
from typing import Dict, Optional

from xdp_parser.xdp_utils import tag_name


def _text_of(el: ET.Element) -> str:
    return (el.text or "").strip()


def _first_label_phrase(text: str) -> str:
    """
    Heuristic: take text up to first tab or run of 2+ spaces.
    'Ministry Funded    Requesting...' -> 'Ministry Funded'
    """
    if not text:
        return ""
    parts = re.split(r"(?:\t| {2,})", text.strip(), maxsplit=1)
    return parts[0].strip()


def _node_text_deep(el: ET.Element) -> str:
    """Join all descendant <text> node strings (first non-empty win for us)."""
    for d in el.iter():
        if tag_name(d.tag).lower() == "text" and _text_of(d):
            return _text_of(d)
    return ""


def _nearest_subform_ancestor(
    field_el: ET.Element,
    parent_map: Optional[Dict[ET.Element, Optional[ET.Element]]] = None,
    search_root: Optional[ET.Element] = None,
) -> Optional[ET.Element]:
    """
    Prefer using parent_map to walk up; fallback to scanning for the direct-parent subform
    (buttons live one level below subform per your doc).
    """
    if parent_map is not None:
        cur = field_el
        while cur is not None:
            if tag_name(cur.tag).lower() == "subform":
                return cur
            cur = parent_map.get(cur)
        return None

    # Fallback: find a subform that has this field as a direct child.
    if search_root is not None:
        for sf in search_root.iter():
            if tag_name(sf.tag).lower() != "subform":
                continue
            # direct children only
            for child in list(sf):
                if child is field_el:
                    return sf
    return None


def _normalize_key(s: str) -> str:
    """lowercase and strip non-alnum so 'Additional MF' ~ 'AdditionalMF'."""
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


def _label_from_sibling_draw(
    field_el: ET.Element, subform_el: ET.Element
) -> Optional[str]:
    """
    Look for a direct child <draw name="lbl<suffix>"> under the given subform,
    where suffix matches the field's 'chk<suffix>'.
    """
    fname = field_el.attrib.get("name") or ""
    if not fname.startswith("chk"):
        return None
    suffix = fname[3:]  # after 'chk'
    want_keys = {f"lbl{suffix}".lower()}
    # Also try normalized comparisons (lblAdditionalMF vs lblAdditional MF)
    norm_suffix = _normalize_key(suffix)

    # Scan ONLY direct children (per your layout)
    for child in list(subform_el):
        if tag_name(child.tag).lower() != "draw":
            continue
        dname = child.attrib.get("name") or ""
        if not dname:
            continue

        # Fast path: exact 'lblSuffix'
        if dname.lower() in want_keys:
            txt = _node_text_deep(child)
            return _first_label_phrase(txt) or txt or dname

        # Normalized fallback: compare lbl + normalized suffix
        if dname.lower().startswith("lbl"):
            label_key = dname[3:]
            if _normalize_key(label_key) == norm_suffix:
                txt = _node_text_deep(child)
                return _first_label_phrase(txt) or txt or dname

    # As a last resort, try *any* draw whose normalized name contains the normalized suffix.
    for child in list(subform_el):
        if tag_name(child.tag).lower() != "draw":
            continue
        dname = child.attrib.get("name") or ""
        if not dname.lower().startswith("lbl"):
            continue
        if norm_suffix and _normalize_key(dname[3:]).find(norm_suffix) != -1:
            txt = _node_text_deep(child)
            if txt:
                return _first_label_phrase(txt) or txt

    return None


def gather_label_text(
    field_el: ET.Element,
    search_root: Optional[ET.Element] = None,
    parent_map: Optional[Dict[ET.Element, Optional[ET.Element]]] = None,
) -> str:
    """
    Try to find a human label for a field.

    Order:
      1) <caption> under the field
      2) <items>/<text> under the field
      3) any descendant <text> nodes
      4) SIBLING <draw name="lbl<suffix>"> under the nearest <subform> ancestor
         where field name is 'chk<suffix>'

    Pass either a `parent_map` (preferred) or a `search_root` so we can locate the subform.
    """

    # 1) caption
    for desc in field_el.iter():
        ln = tag_name(desc.tag).lower()
        if ln == "caption" and _text_of(desc):
            return _first_label_phrase(_text_of(desc)) or _text_of(desc)

    # 2) items/text
    for desc in field_el.iter():
        ln = tag_name(desc.tag).lower()
        if ln == "items":
            # look for <text> beneath items
            for dd in desc.iter():
                if tag_name(dd.tag).lower() == "text" and _text_of(dd):
                    return _first_label_phrase(_text_of(dd)) or _text_of(dd)

    # 3) any descendant text
    deep = _node_text_deep(field_el)
    if deep:
        return _first_label_phrase(deep) or deep

    # 4) sibling draw under nearest subform: lbl<suffix>
    subform = _nearest_subform_ancestor(
        field_el, parent_map=parent_map, search_root=search_root
    )
    if subform is not None:
        sib = _label_from_sibling_draw(field_el, subform)
        if sib:
            return sib

    # fallback: empty string
    return ""
