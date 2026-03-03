from abc import ABC, abstractmethod
import xml.etree.ElementTree as ET
from typing import Any, Optional
from xdp_parser.control_labels import ControlLabels
from xdp_parser.parse_context import ParseContext


class AbstractXdpFactory(ABC):
    def __init__(self, context: ParseContext):
        self.context = context

    @abstractmethod
    def handle_object_array(
        self, container: ET.Element, labels: ControlLabels, row_fields: list
    ) -> Any: ...

    @abstractmethod
    def handle_radio(self, elem: ET.Element, labels: ControlLabels) -> Any:
        """
        Accepts either:
          - explicit radio groups: <exclGroup ...>
          - implicit radio groups: a <subform> that contains radio-style buttons (entire subform)
          - anything else (e.g., <field>) should typically return None to avoid duplicate handling
        """
        ...

    @abstractmethod
    def handle_checkbox(self, field: ET.Element, labels: ControlLabels) -> Any: ...

    @abstractmethod
    def handle_basic_input(self, field: ET.Element, labels: ControlLabels) -> Any: ...

    @abstractmethod
    def handle_radio_subform(
        self, element: ET.Element, labels: ControlLabels
    ) -> Any: ...

    @abstractmethod
    def handle_help_text(self, elem: ET.Element, help_text: str) -> Any: ...

    @abstractmethod
    def handle_help_icon(self, elem: ET.Element, help_text: str) -> Any: ...

    def get_enum_maps(self) -> Optional[dict[str, dict[str, str]]]:
        """Override if your factory needs enum maps."""
        return None
