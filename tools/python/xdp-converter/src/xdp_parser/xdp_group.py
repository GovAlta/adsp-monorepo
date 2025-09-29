import xml.etree.ElementTree as ET
from schema_generator.form_element import FormElement
from schema_generator.form_group import FormGroup
from xdp_parser.xdp_element import XdpElement


class XdpGroup(XdpElement):
    def __init__(
        self,
        subform: ET.Element,
        elements: list["XdpElement"],
        label: str | None = None,
    ):
        super().__init__(subform)
        self.elements = elements
        self.label = label or subform.get("name") or ""

    def to_form_element(self) -> FormElement:
        group_elements = []
        for element in self.elements:
            fe = element.to_form_element()
            if fe:
                group_elements.append(fe)
        return FormGroup(self.label, group_elements)
