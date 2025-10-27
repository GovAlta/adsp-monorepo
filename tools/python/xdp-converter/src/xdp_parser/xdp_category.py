from schema_generator.form_category import FormCategory
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_subform import get_subform_label


class XdpCategory(XdpElement):
    def __init__(self, xdp_element, elements):
        super().__init__(xdp_element)
        self.elements = elements

    def to_form_element(self):
        title = get_subform_label(self.xdp_element) or self.xdp_element.attrib.get(
            "name", "Untitled"
        )
        nodes = []
        for element in self.elements:
            fe = element.to_form_element()
            if fe:
                nodes.append(fe)
        name = self.xdp_element.attrib.get("name", "Untitled")
        return FormCategory(name, title, nodes)
