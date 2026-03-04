from typing import Optional

from schema_generator.form_element import FormElement
from schema_generator.form_layout import FormLayout
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement


class XdpLayout(XdpElement):
    def __init__(
        self, xdp, layoutType: str, elements: list[XdpElement], context: ParseContext
    ):
        super().__init__(xdp, None, context)
        self.layoutType = layoutType
        self.elements = elements

    def to_form_element(self) -> Optional[FormElement]:
        nodes = []
        for element in self.elements:
            fe = element.to_form_element()
            if fe:
                nodes.append(fe)
        if nodes:
            return FormLayout(self.layoutType, nodes, self.context)
        return None

    def iter_descendants_for_footprint(self):
        return list(self.elements)
