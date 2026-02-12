from __future__ import annotations

from typing import List, Optional, Tuple
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_help_control_pair import XdpHelpControlPair

Footprint = Tuple[float, float, float, float]


def _fmt_fp(fp: Optional[Footprint]) -> str:
    if fp is None:
        return "None"
    x1, y1, x2, y2 = fp
    return f"({x1:.2f},{y1:.2f})-({x2:.2f},{y2:.2f})"


def _kind(e: XdpElement) -> str:
    if e.is_help_icon():
        return "HICON"
    if e.is_help_text():
        return "HTXT"
    if e.is_control():
        return "CTRL"
    return "OTHER"


def _extract_traversal_target_from_xdp_elem(xdp_elem) -> Optional[str]:
    """
    Works on raw ET element: finds .//traversal/traverse ref="Name[0]"
    Returns "Name" or None.
    """
    if xdp_elem is None:
        return None
    trav = xdp_elem.find(".//traversal/traverse")
    if trav is None:
        return None
    ref = (trav.get("ref") or "").strip()
    if not ref:
        return None
    return ref.split("[", 1)[0]


def dump_elements(
    stage: str,
    *,
    subform_name: str,
    elements: List[XdpElement],
    max_items: int = 80,
) -> None:
    print(f"\n[DUMP:{stage}] subform={subform_name} len={len(elements)}")
    print(
        "  idx kind  name                          cls                           fp                  ext_fp               extra"
    )
    print(
        "  --- ----  ----------------------------  ----------------------------  ------------------  ------------------  ------------------------------"
    )

    for i, e in enumerate(elements[:max_items]):
        nm = e.get_name() or "(no-name)"
        cls = e.__class__.__name__

        # footprints
        fp = e.footprint()
        ext_fp = e.extended_footprint()

        extra_parts: List[str] = []

        # Pair details
        if isinstance(e, XdpHelpControlPair):
            # Assuming your pair exposes these; adjust if names differ.
            # (No getattr-style silent access; if it breaks, it breaks loudly.)
            help_el = e.help
            ctrl_el = e.control
            extra_parts.append(
                f"PAIR help={help_el.get_name()} ctrl={ctrl_el.get_name()}"
            )

        # Help traversal target
        if isinstance(e, XdpHelpText):
            tgt = _extract_traversal_target_from_xdp_elem(e.xdp_element)
            if tgt:
                extra_parts.append(f"trav={tgt}")

        # If your help icon element is NOT XdpHelpText but still has xdp_element:
        if e.is_help_icon():
            # Many of your element types appear to carry .xdp_element; this will fail loudly if not.
            try:
                tgt = _extract_traversal_target_from_xdp_elem(e.xdp_element)
                if tgt:
                    extra_parts.append(f"trav={tgt}")
            except Exception as ex:
                extra_parts.append(f"trav_err={type(ex).__name__}")

        extra = " | ".join(extra_parts)

        print(
            f"  {i:03d} {_kind(e):4}  {nm:<28}  {cls:<28}  "
            f"{_fmt_fp(fp):<18}  {_fmt_fp(ext_fp):<18}  {extra}"
        )

    if len(elements) > max_items:
        print(f"  ... truncated, showing first {max_items} of {len(elements)}")
