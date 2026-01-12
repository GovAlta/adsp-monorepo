from schema_generator.form_layout import FormLayout
from xdp_parser.xdp_element import XdpElement


class XdpLayout(XdpElement):
    def __init__(self, xdp, layoutType, elements):
        super().__init__(xdp)
        self.layoutType = layoutType
        self.elements = elements

    def to_form_element(self):
        nodes = []
        for element in self.elements:
            fe = element.to_form_element()
            if fe:
                nodes.append(fe)
        if nodes:
            return FormLayout(self.layoutType, nodes, self.context)
        return None

    def iter_descendants_for_bbox(self):
        return list(self.elements)
