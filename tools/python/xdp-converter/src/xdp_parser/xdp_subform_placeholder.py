# xdp_parser/xdp_subform_placeholder.py

from typing import List
import xml.etree.ElementTree as ET

from xdp_parser.xdp_element import XdpElement, XdpGeometry
from xdp_parser.parse_context import ParseContext


class XdpSubformPlaceholder(XdpElement):
    """
    Structural node representing an XDP <subform>.

    - Holds the raw subform element
    - Holds already-parsed children (controls, nested placeholders, etc.)
    - NEVER converts directly to JSONForms; a separate grouping pass
      will decide whether this becomes an XdpGroup or is flattened.
    """

    def __init__(
        self,
        subform_elem: ET.Element,
        children: List[XdpElement],
        context: ParseContext,
    ) -> None:
        super().__init__(subform_elem, context)
        self.subform_elem = subform_elem
        self.children: List[XdpElement] = children
        self._name = subform_elem.get("name") or ""

        # Use the subform's geometry as a base
        self.geometry = XdpGeometry.resolve(subform_elem, context.parent_map)

    def get_name(self) -> str:
        return self._name

    def is_group_placeholder(self) -> bool:
        return True

    def iter_children(self) -> List[XdpElement]:
        return list(self.children)

    def to_form_element(self) -> dict | None:
        """
        Placeholders are never emitted directly to UI.
        They must be consumed by the grouping pass.
        """
        return None

    def iter_descendants_for_footprint(self):
        return list(self.children)
