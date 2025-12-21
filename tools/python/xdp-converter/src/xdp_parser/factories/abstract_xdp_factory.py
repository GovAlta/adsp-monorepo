from abc import ABC, abstractmethod
import xml.etree.ElementTree as ET
from typing import Any, Optional
from xdp_parser.control_labels import ControlLabels


class AbstractXdpFactory(ABC):
    def __init__(self, context=None):
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
    def handle_group(
        self, elem: ET.Element, children: list, label: str
    ) -> Optional[Any]:
        pass
