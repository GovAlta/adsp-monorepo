import re
import xml.etree.ElementTree as ET
from typing import List, Optional

from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement, XdpGeometry
from xdp_parser.xdp_file_upload import XdpFileUpload
from xdp_parser.xdp_group import XdpGroup
from xdp_parser.xdp_help_icon import XdpHelpIcon
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_object_array import XdpObjectArray
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_pseudo_radio import XdpPseudoRadio, extract_radio_button_labels
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
            return XdpPseudoRadio(element, radio_labels, labels)
        return None

    def handle_help_text(self, elem, help_text):
        return XdpHelpText(elem, help_text, self.context)

    def handle_help_icon(self, elem, help_text):
        return XdpHelpIcon(elem, help_text, self.context)

    # ----------------------------------------------------------------------
    # GROUP LOGIC
    # ----------------------------------------------------------------------
    def handle_group(
        self,
        subform: ET.Element,
        elements: List[XdpElement],
        resolved_label: str | None,
    ) -> Optional[XdpElement]:

        if not elements:
            return None

        has_real_control = any(e.is_control() for e in elements)
        if not has_real_control:
            return None

        self._suppress_descendant_duplicate_group_labels(elements, resolved_label)
        group = XdpGroup(subform, elements, self.context, resolved_label)

        base_geo = XdpGeometry.resolve(subform, self.context.parent_map)
        group.geometry = XdpGeometry.from_children(elements, fallback=base_geo)

        return group

    def _suppress_descendant_duplicate_group_labels(self, elements, parent_label):
        if not parent_label:
            return
        for e in elements:
            if isinstance(e, XdpGroup) and e.label:
                if self._normalize_label(e.label) == self._normalize_label(
                    parent_label
                ):
                    e.label = None

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

    @staticmethod
    def _normalize_label(s: str | None) -> str:
        if not s:
            return ""
        s = s.strip()
        s = re.sub(r"\s+", " ", s)
        s = s.casefold()
        s = s.rstrip(" .:;")
        return s
