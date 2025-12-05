# group_label_resolver.py

from __future__ import annotations
import re
from typing import List, Optional

from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_element import XdpElement, XdpGeometry


def resolve_group_label(subform, context) -> str:
    """
    Determine the best label for a grouped subform.

    Priorities:
      1. True section headers (e.g., "Section 3: ...")
      2. First help text (visually sorted)
      3. First inline caption from a child control
      4. Humanized subform name ("Section3Default" → "Section 3")
      5. Raw subform name as a last resort
    """

    # -------------------------
    # Collect child elements
    # -------------------------
    children: List[XdpElement] = context.child_map.get(id(subform), [])

    # -------------------------
    # Geometry-enabled sorting
    # -------------------------
    def sort_key(elem: XdpElement):
        geo = getattr(elem, "geometry", None)
        if not geo:
            geo = XdpGeometry.resolve(elem.xdp, context.parent_map)

        # Use 0 instead of 9999 for missing coordinates
        y = geo.y if geo and geo.y is not None else 0
        x = geo.x if geo and geo.x is not None else 0

        return (y, x)

    sorted_children = sorted(children, key=sort_key)

    # -------------------------
    # 1. True HEADER detection
    # -------------------------
    header = _find_section_header(sorted_children)
    if header:
        return header

    # -------------------------
    # 2. First visible help text
    # -------------------------
    first_help = _find_first_help(sorted_children)
    if first_help:
        return first_help

    # -------------------------
    # 3. Inline captions from controls
    # -------------------------
    inline = _find_inline_caption(sorted_children)
    if inline:
        return inline

    # -------------------------
    # 4. Humanize subform name
    # -------------------------
    sf_name = subform.get("name") or ""
    human = _humanize_name(sf_name)
    if human:
        return human

    # -------------------------
    # 5. Absolute fallback
    # -------------------------
    return sf_name or "Group"


# ------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------


def _find_section_header(children: List[XdpElement]) -> Optional[str]:
    for e in children:
        if isinstance(e, XdpHelpText):
            text = (e.text or "").strip()
            if _is_section_header(text):
                return text
    return None


def _find_first_help(children: List[XdpElement]) -> Optional[str]:
    for e in children:
        if isinstance(e, XdpHelpText):
            text = (e.text or "").strip()
            if text:
                return text
    return None


def _find_inline_caption(children: List[XdpElement]) -> Optional[str]:
    for e in children:
        caption = getattr(e, "label", None) or getattr(e, "caption", None)
        if caption:
            caption = caption.strip()
            if caption and caption.lower() not in {"i"}:  # ignore info buttons etc
                return caption
    return None


# Heuristic replicated from grouping pass
def _is_section_header(text: str) -> bool:
    if not text:
        return False
    if text.startswith("Section "):
        return True
    if text.endswith(":") and len(text) <= 60:
        return True
    return False


def _humanize_name(name: str) -> str:
    """
    Turns:
      "Section3Default" -> "Section 3"
      "VehicleInfo"     -> "Vehicle Info"
    """
    if not name:
        return ""

    # Insert spaces before capitals and numbers
    s = re.sub(r"([a-z])([A-Z0-9])", r"\1 \2", name)
    s = re.sub(r"([A-Za-z])([0-9])", r"\1 \2", s)
    parts = s.split()

    # Prefer first two parts as the semantic label
    if len(parts) >= 2:
        return " ".join(parts[:2])

    return s
