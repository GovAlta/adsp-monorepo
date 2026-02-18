from __future__ import annotations

from dataclasses import dataclass
from typing import List
import xml.etree.ElementTree as ET

from schema_generator.form_layout import FormLayout
from xdp_parser.xdp_element import XdpElement
from schema_generator.form_element import FormElement


@dataclass
class XdpRow(XdpElement):
    """
    A layout-only container representing one horizontal row.
    """

    children: List[XdpElement]

    def __init__(self, owner_subform: ET.Element, children: List[XdpElement], context):
        super().__init__(owner_subform, labels=None, context=context)
        self.children = children
        self.is_leaf = False

        # Geometry: union of children (helps debug + later grouping)
        base = self.geometry
        self.geometry = type(base).from_children(children, fallback=base)

    def iter_descendants_for_footprint(self):
        return self.children

    def is_control(self):
        return False

    def to_form_element(self) -> FormElement:
        return FormLayout(
            "HorizontalLayout",
            [c.to_form_element() for c in self.children],
            self.context,
        )
