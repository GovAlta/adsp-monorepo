from schema_generator.form_category import FormCategory
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_layout import XdpLayout

class XdpCategory(XdpElement):
    def __init__(self, xdp_element, elements):
        super().__init__(xdp_element)
        self.elements = elements
        self.hidden = xdp_element.attrib.get("presence") == "hidden"

    def to_form_element(self):
        title = self.get_category_label(self.xdp_element) or self.xdp_element.attrib.get("name", "Untitled")
        nodes = []
        for element in self.elements:
            fe = element.to_form_element()
            if fe:
                nodes.append(fe)
        return FormCategory(title, self.hidden, nodes)
    
    def get_category_label(self, category):
        # Handle namespace if present
        if category.tag.startswith("{"):
            uri = category.tag.split("}")[0].strip("{")
            ns = {"xfa": uri}
            draws = category.findall(".//xfa:draw", namespaces=ns)
        else:
            draws = category.findall(".//draw")

        for draw in draws:
            # Look for direct <value> child
            value_elem = draw.find("xfa:value", namespaces=ns) if ns else draw.find("value")
            if value_elem is not None:
                # Check if it contains any <text> or has text content
                has_text = any(child.tag.endswith("text") for child in value_elem)
                if has_text or (value_elem.text and value_elem.text.strip()):
                    return self.get_draw_value_text(draw)
        return None

    def get_draw_value_text(self, draw_element):
        if draw_element.tag.startswith("{"):
            uri = draw_element.tag.split("}")[0].strip("{")
            ns = {"xfa": uri}
            value_elem = draw_element.find("xfa:value", namespaces=ns)
        else:
            ns = {}
            value_elem = draw_element.find("value")

        if value_elem is None:
            return None

        # Simple <text> child
        for child in value_elem:
            if child.tag.endswith("text") and child.text:
                return child.text.strip()

        # fallback to value_elem.text
        if value_elem.text and value_elem.text.strip():
            return value_elem.text.strip()

        return None
    