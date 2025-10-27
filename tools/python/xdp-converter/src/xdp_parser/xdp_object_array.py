from typing import List
from schema_generator.form_element import FormElement
from schema_generator.form_object_array import FormObjectArray
from xdp_parser.control_labels import ControlLabels
from xdp_parser.xdp_element import XdpElement


class XdpObjectArray(XdpElement):

    def __init__(
        self, node, name: str, columns: List[XdpElement], labels: ControlLabels
    ):
        super().__init__(node, labels)
        self.name = name
        self.columns = columns

    def to_form_element(self) -> FormElement:
        children = []
        for col in self.columns:
            fe = col.to_form_element()
            if fe:
                children.append(fe)
        if children:
            return FormObjectArray(self.name, children)
        return None
