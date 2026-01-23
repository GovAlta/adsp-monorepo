import xml.etree.ElementTree as ET
from schema_generator.form_element import FormElement
from schema_generator.form_layout import FormGroup
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement


class XdpGroup(XdpElement):
    def __init__(
        self,
        subform: ET.Element,
        elements: list["XdpElement"],
        context: ParseContext,
        label: str | None = None,
    ):
        super().__init__(subform, context=context)
        self.elements = elements
        # Capture layout from subform (<subform layout="...">)
        self.layout = subform.get("layout", "").lower() if subform is not None else ""
        self.label: str | None = label

        # If the subform itself has no coordinates, infer from children
        self.inheritGeometry(elements)

    def inheritGeometry(self, elements):
        # infer y if missing
        if self.geometry.y is None:
            ys = [e.geometry.y for e in elements if e.geometry.y is not None]
            self.geometry.y = min(ys) if ys else 0  # default was 9999, now 0

        # infer x if missing
        if self.geometry.x is None:
            xs = [e.geometry.x for e in elements if e.geometry.x is not None]
            self.geometry.x = min(xs) if xs else 0  # same fix

    def to_form_element(self) -> FormElement:
        group_elements = []
        for element in self.elements:
            fe = element.to_form_element()
            if fe:
                group_elements.append(fe)

        return FormGroup(
            self.get_name(),
            self.full_path,
            self.label or "",  # FormGroup expects a string
            group_elements,
            self.context,
        )

    def iter_descendants_for_bbox(self):
        return list(self.elements)
