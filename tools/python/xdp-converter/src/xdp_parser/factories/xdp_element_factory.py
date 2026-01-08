import xml.etree.ElementTree as ET
from typing import List, Optional

from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.parse_context import ParseContext
from xdp_parser.subform_label import get_subform_header_label
from xdp_parser.xdp_element import XdpElement, XdpGeometry
from xdp_parser.xdp_file_upload import XdpFileUpload
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
        if self.is_file_upload_field(field):
            return XdpFileUpload(field, labels, context=self.context)
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

        if not elements:
            return None

        elements = self._sort_by_geometry(elements)

        has_real_control = any(
            getattr(e, "is_control", lambda: False)()
            or getattr(e, "is_radio", False)
            or getattr(e, "is_array", False)
            for e in elements
        )
        if not has_real_control:
            return None

        # 🔑 Single source of truth
        resolved_label = get_subform_header_label(subform)

        group = XdpGroup(subform, elements, self.context, resolved_label)

        base_geo = XdpGeometry.resolve(subform, self.context.parent_map)
        group.geometry = XdpGeometry.from_children(elements, fallback=base_geo)

        return group

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

    def is_file_upload_field(self, field_elem):
        ui = field_elem.find("ui")
        return ui is not None and any(child.tag in ("imageEdit",) for child in ui)
