import xml.etree.ElementTree as ET
from typing import List, Optional

from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.group_label_resolver import resolve_group_label
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement, XdpGeometry
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_object_array import XdpObjectArray
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_radio_selector import XdpRadioSelector, extract_radio_button_labels
from xdp_parser.xdp_checkbox import XdpCheckbox
from xdp_parser.xdp_basic_input import XdpBasicInput


class XdpElementFactory(AbstractXdpFactory):
    """
    Builds real XdpElement instances for rendering/schema generation.
    Now uses authoritative top-level subform knowledge from the parser.
    """

    def __init__(self, context: ParseContext):
        super().__init__(context)

    # ----------------------------------------------------------------------
    # Basic handlers
    # ----------------------------------------------------------------------
    def handle_object_array(self, container, labels, row_fields):
        return XdpObjectArray(
            container,
            container.get("name") or "Items",
            row_fields,
            labels,
            context=self.context,
        )

    def handle_radio(self, elem, labels):
        return XdpRadio(elem, labels, context=self.context)

    def handle_checkbox(self, field, labels):
        return XdpCheckbox(field, labels, context=self.context)

    def handle_basic_input(self, field, labels):
        return XdpBasicInput(field, labels, context=self.context)

    def handle_radio_subform(self, element, labels):
        radio_labels = extract_radio_button_labels(element)
        if radio_labels:
            return XdpRadioSelector(element, radio_labels, labels)
        return None

    def handle_help_text(self, elem, help_text):
        return XdpHelpText(elem, help_text, self.context)

    # ----------------------------------------------------------------------
    # GROUP LOGIC
    # ----------------------------------------------------------------------
    def handle_group(
        self, subform: ET.Element, elements: List[XdpElement], _: str
    ) -> Optional[XdpElement]:
        """
        Build a logical group (FormGroup) from a subform.

        • Sorts children by geometry
        • Hoists section headers (ONLY for top-level subforms)
        • Removes empty/help-only groups
        • Computes group geometry
        """
        if not elements:
            return None

        # --------------------------------------------------
        # 1) sort by (y, x)
        # --------------------------------------------------
        elements = self._sort_by_geometry(elements)

        # Pick a proper group label
        resolved_label = resolve_group_label(subform, self.context)

        has_real_control = any(
            getattr(e, "is_control", lambda: False)()
            or getattr(e, "is_radio", False)
            or getattr(e, "is_array", False)
            for e in elements
        )

        if not has_real_control:
            return None

        group = XdpGroup(subform, elements, self.context, resolved_label)

        base_geo = XdpGeometry.resolve(subform, self.context.parent_map)
        group.geometry = XdpGeometry.from_children(elements, fallback=base_geo)

        return group

    # # ----------------------------------------------------------------------
    # # HEADER LOGIC
    # # ----------------------------------------------------------------------
    # def _should_hoist_header(self, subform, elements, layout) -> bool:
    #     """
    #     A header is only hoisted when:
    #     • the subform is a true top-level subform (per parser)
    #     • it contains at least one help-text element
    #     • AND the first help-text looks like a major section header
    #     """
    #     if not self._is_top_level_subform(subform):
    #         return False

    #     first_help = next((e for e in elements if e.is_help_text()), None)
    #     if not first_help:
    #         return False

    #     # Major section headers should be single-line, shortish, section-like
    #     return self._looks_like_major_section_header(first_help)

    # def _looks_like_major_section_header(self, help_el: XdpHelpText) -> bool:
    #     text = (help_el.get_text() or "").strip()
    #     if not text:
    #         return False

    #     # Hard reject: multi-line long blobs are NOT section headers
    #     if "\n" in text or len(text) > 60:
    #         return False

    #     # Strong match
    #     if text.lower().startswith("section"):
    #         return True

    #     # Weak match: short single-line help texts
    #     return True

    # def _find_section_header(self, elements, layout):
    #     # strong: top-most help by y
    #     help_elems = [
    #         e for e in elements if e.is_help_text() and e.geometry.y is not None
    #     ]
    #     if help_elems:
    #         return min(help_elems, key=lambda e: e.geometry.y)

    #     # fallback: for tb-like flows, first help
    #     if layout in ("tb", "lr-tb"):
    #         return next((e for e in elements if e.is_help_text()), None)

    #     return None

    # def _hoist_section_header(self, elements: List[XdpElement], layout: str):
    #     header = self._find_section_header(elements, layout)
    #     if not header:
    #         return elements
    #     print(f"[HeaderHoist] Found header to hoist: {get_text(header)}")

    #     # Extract header text and stash it
    #     try:
    #         self._last_header_text = get_text(header).strip()
    #         print(f"[HeaderHoist] Extracted header text: {self._last_header_text}")
    #     except Exception:
    #         self._last_header_text = None

    #     new = [header] + [el for el in elements if el is not header]

    #     print(f"[HeaderHoist] Hoisted header to top for layout='{layout}'")
    #     return new

    # ----------------------------------------------------------------------
    # GEOMETRY SORT
    # ----------------------------------------------------------------------
    def _sort_by_geometry(self, elements: List[XdpElement]) -> List[XdpElement]:
        def key(el: XdpElement):
            geo = el.geometry
            if geo.y is None:
                return (float("inf"), float("inf"))
            x = geo.x if geo.x is not None else float("inf")
            return (geo.y, x)

        sorted_elements = sorted(elements, key=key)

        return sorted_elements

    # ----------------------------------------------------------------------
    # AUTHORITATIVE top-level detection
    # ----------------------------------------------------------------------
    def _is_top_level_subform(self, subform: ET.Element) -> bool:
        top = self.context.get("top_subforms", set())
        return id(subform) in top

    def _is_static_hidden(self, subform: ET.Element) -> bool:
        presence = (subform.get("presence") or "").strip().lower()
        return presence == "hidden"
