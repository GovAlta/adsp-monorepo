import xml.etree.ElementTree as ET
from typing import Any, Optional

from xdp_parser.control_labels import ControlLabels
from xdp_parser.factories.abstract_xdp_factory import AbstractXdpFactory
from xdp_parser.group_labels import find_group_label
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_help_text import XdpHelpText
from xdp_parser.xdp_object_array import XdpObjectArray
from xdp_parser.xdp_radio import XdpRadio
from xdp_parser.xdp_radio_selector import XdpRadioSelector, extract_radio_button_labels
from xdp_parser.xdp_checkbox import XdpCheckbox
from xdp_parser.xdp_basic_input import XdpBasicInput
from xdp_parser.xdp_group import XdpGroup


class XdpElementFactory(AbstractXdpFactory):
    """
    Builds real XdpElement instances for rendering/schema generation.
    """

    def __init__(self, context: ParseContext):
        super().__init__(context)

    def handle_object_array(
        self, container: ET.Element, labels: ControlLabels, row_fields: list
    ) -> Any:
        # The XdpParser will gather columns; here we wrap the container.
        return XdpObjectArray(
            container,
            container.get("name") or "Items",
            row_fields,
            labels,
            context=self.context,
        )

    def handle_radio(self, elem: ET.Element, labels: ControlLabels) -> Optional[Any]:
        return XdpRadio(elem, labels, context=self.context)

    def handle_checkbox(self, field: ET.Element, labels: ControlLabels) -> Any:
        return XdpCheckbox(field, labels, context=self.context)

    def handle_basic_input(self, field: ET.Element, labels: ControlLabels) -> Any:
        return XdpBasicInput(field, labels, context=self.context)

    def handle_radio_subform(self, element: ET.Element, labels: ControlLabels) -> Any:
        radio_labels = extract_radio_button_labels(element)
        if radio_labels:
            return XdpRadioSelector(element, radio_labels, labels)
        return None

    def handle_help_text(self, elem: ET.Element, help_text: str) -> Any:
        return XdpHelpText(help_text, self.context)
