import xml.etree.ElementTree as ET
from typing import Any, List, Optional

from xdp_parser.control_labels import ControlLabels
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
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
        return XdpHelpText(help_text, self.context)

    # ----------------------------------------------------------------------
    # Group handling
    # ----------------------------------------------------------------------
    def handle_group(
        self, subform: ET.Element, elements: List[XdpElement], label: str
    ) -> Optional[XdpElement]:
        """
        Build a logical group (FormGroup) from a subform.

        This version:
        • Sorts children by geometry
        • Hoists top-most HelpContent as header
        • Eliminates empty or help-only groups
        • Computes group geometry safely
        """

        # ------------------------------------------------------------------
        # 0) If nothing survived parsing, skip group
        # ------------------------------------------------------------------
        if not elements:
            return None

        # ------------------------------------------------------------------
        # 1) Sort children by visual order (y, then x)
        # ------------------------------------------------------------------
        elements = self._sort_by_geometry(elements)

        # ------------------------------------------------------------------
        # 2) Hoist a HelpContent section header if present
        # ------------------------------------------------------------------
        # Extract layout attribute (default: tb or lr-tb)
        layout = (subform.get("layout") or "").lower().strip()
        if not layout:
            layout = "lr-tb"

        if self._should_hoist_header(subform, elements, layout):
            elements = self._hoist_section_header(elements, layout)
        # ------------------------------------------------------------------
        # 3) Decide whether this subform is *worth* becoming a group.
        #
        # A group is only valid if it contains at least one REAL control
        # (checkbox, text input, radio group, array, etc.)
        #
        # HelpContent-only subforms should NOT become groups.
        # ------------------------------------------------------------------
        has_real_control = any(
            getattr(e, "is_control", lambda: False)()
            or getattr(e, "is_radio", False)
            or getattr(e, "is_array", False)
            for e in elements
        )

        if not has_real_control:
            # This is a layout/visual subform — ignore it
            print(f"[SkipGroup] Ignored subform '{label}' (no real controls).")
            return None

        # ------------------------------------------------------------------
        # 4) Build XdpGroup with the cleaned element list
        # ------------------------------------------------------------------
        group = XdpGroup(subform, elements, self.context, label)

        # ------------------------------------------------------------------
        # 5) Compute geometry from subform + children
        # ------------------------------------------------------------------
        base_geo = XdpGeometry.from_xdp(subform)
        group.geometry = XdpGeometry.from_children(elements, fallback=base_geo)

        print(
            f"[GroupGeom] Final group '{label}' "
            f"at y={group.geometry.y}, x={group.geometry.x}"
        )

        return group

    def _should_hoist_header(self, subform, elements, layout):
        # Only top-level groups
        if not self._is_top_level_subform(subform):
            return False

        # Help text must clearly be a section header
        first_help = next((e for e in elements if e.is_help()), None)
        if not first_help:
            return False

        if not self._looks_like_major_section_header(first_help):
            return False

        return True

    # ----------------------------------------------------------------------
    # Header logic
    # ----------------------------------------------------------------------
    def _find_section_header(self, elements, subform_layout):
        # strongest: the top-most HelpContent by y
        help_elems = [
            e for e in elements if e.is_help_text() and e.geometry.y is not None
        ]
        if help_elems:
            return min(help_elems, key=lambda e: e.geometry.y)

        # weaker: if tb-flow, first HelpContent
        if subform_layout in ("tb", "lr-tb"):
            for e in elements:
                if e.is_help_text():
                    return e

        return None

    def _hoist_section_header(self, elements: List[XdpElement], layout: str):
        header = self._find_section_header(elements, layout)
        if not header:
            return elements

        new = [header] + [el for el in elements if el is not header]

        print(f"[HeaderHoist] Hoisted header to top for layout='{layout}'")

        return new

    # ----------------------------------------------------------------------
    # Geometry sorting
    # ----------------------------------------------------------------------
    def _sort_by_geometry(self, elements: List[XdpElement]) -> List[XdpElement]:
        def key(el: XdpElement):
            geo = el.geometry
            if geo.y is None:
                return (float("inf"), float("inf"))
            x = geo.x if geo.x is not None else float("inf")
            return (geo.y, x)

        sorted_elements = sorted(elements, key=key)

        print("[GeomSort] Sorted elements:")
        for el in sorted_elements:
            geo = el.geometry
            print(
                f"  - {el.__class__.__name__}('{el.get_name()}') at y={geo.y}, x={geo.x}"
            )

        return sorted_elements
