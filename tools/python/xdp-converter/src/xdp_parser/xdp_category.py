import xml.etree.ElementTree as ET
from schema_generator.form_category import FormCategory
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import tag_name


class XdpCategory(XdpElement):
    def __init__(self, xdp_element, elements):
        super().__init__(xdp_element)
        self.elements = elements

    def to_form_element(self):
        title = self._get_category_label() or self.xdp_element.attrib.get(
            "name", "Untitled"
        )
        nodes = []
        for element in self.elements:
            fe = element.to_form_element()
            if fe:
                nodes.append(fe)
        name = self.xdp_element.attrib.get("name", "Untitled")
        return FormCategory(name, title, nodes)

    def _text_of_value(self, draw_el: ET.Element) -> str:
        """
        Extract text from a <value> under <draw>, looking for any <text> child first,
        otherwise the direct text content of <value>.
        """
        # handle namespaces generically by checking local-names
        for child in draw_el:
            if tag_name(child.tag).lower() == "value":
                # prefer nested <text>
                for g in child.iter():
                    if tag_name(g.tag).lower() == "text" and (
                        g.text and g.text.strip()
                    ):
                        return g.text.strip()
                # else raw value text
                if child.text and child.text.strip():
                    return child.text.strip()
                break
        return ""

    def _get_category_label(self) -> str | None:
        """
        Find the title for a <subform> 'category'.
        Preference order:
        1) direct child <draw name="lblHeader"> (strongest signal)
        2) any descendant  <draw name="lblHeader"> (nearest is ok)
        3) fallback: first <draw> that has a non-empty <value>/<text>
        Returns the label string or None.
        """
        # 1) prefer a direct child draw named lblHeader
        for child in list(self.xdp_element):
            if tag_name(child.tag).lower() != "draw":
                continue
            name_attr = child.attrib.get("name") or ""
            if name_attr.lower() == "lblheader":
                txt = self._text_of_value(child)
                if txt:
                    return txt

        # 2) else, any descendant draw named lblHeader (first hit wins)
        for d in self.xdp_element.iter():
            if tag_name(d.tag).lower() != "draw":
                continue
            name_attr = d.attrib.get("name") or ""
            if name_attr.lower() == "lblheader":
                txt = self._text_of_value(d)
                if txt:
                    return txt

        # 3) fallback: first draw with usable <value>/<text>
        for d in self.xdp_element.iter():
            if tag_name(d.tag).lower() != "draw":
                continue
            txt = self._text_of_value(d)
            if txt:
                return txt

        return None
