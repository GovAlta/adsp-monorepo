# xdp_parser/factories/base_factory.py

from abc import ABC, abstractmethod
import xml.etree.ElementTree as ET
from typing import Optional, Any


class BOB(ABC):
    """Defines per-element build interface for parser traversal."""

    @abstractmethod
    def handle_basic_input(self, elem: ET.Element, control_labels) -> Optional[Any]:
        pass

    @abstractmethod
    def handle_radio(self, elem: ET.Element, control_labels) -> Optional[Any]:
        pass

    @abstractmethod
    def handle_checkbox(self, elem: ET.Element, control_labels) -> Optional[Any]:
        pass

    @abstractmethod
    def handle_object_array(self, elem: ET.Element, control_labels) -> Optional[Any]:
        pass

    @abstractmethod
    def handle_group(
        self, elem: ET.Element, children: list, label: str
    ) -> Optional[Any]:
        pass

    @abstractmethod
    def handle_help_text(self, elem: ET.Element, text: str) -> Optional[Any]:
        pass
