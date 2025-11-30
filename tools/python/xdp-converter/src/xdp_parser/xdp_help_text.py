from schema_generator.form_help_text import FormHelpText
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement
import xml.etree.ElementTree as ET


class XdpHelpText(XdpElement):
    def __init__(self, help_content: str, context: ParseContext):
        print(f"################## found string help {help_content}")
        el = ET.Element("draw")
        el.text = help_content
        xdp = el
        self.text = help_content
        super().__init__(xdp, context=context)

    def to_form_element(self):
        return FormHelpText(self.xdp_element, self.context)

    def is_help_text(self):
        return True

    def get_text(self):
        print(f"################## get_text returning {self.text}")
        return self.text

    @staticmethod
    def get_help_text(node):
        """
        Extract help or guidance text from a <draw> element or similar container.
        Accepts both plain <value><text> and HTML <exData> forms.
        Returns raw text string (not XML node).
        """
        MIN_SIZE = 20

        # 1️⃣ Accept <draw> nodes (most guidance) and any node with obvious text blocks
        tag = node.tag.lower()
        if tag not in {"draw", "exdata", "assist"}:
            return None

        # 2️⃣ Ignore bind/calculate/event scripts
        if any(node.findall(f".//{tag}") for tag in ("bind", "calculate", "event")):
            return None

        # 3️⃣ Try HTML help text first (<exData contentType='text/html'>)
        exdata = node.find(".//value/exData[@contentType='text/html']")
        if exdata is not None:
            text = " ".join(exdata.itertext()).strip()
            if len(text) >= MIN_SIZE:
                return text

        # 4️⃣ Fallback: plain text <value><text>
        text_node = node.find(".//value/text")
        if text_node is not None and text_node.text:
            text = text_node.text.strip()
            if len(text) >= MIN_SIZE:
                return text

        # 5️⃣ Fallback: inline text directly in the <draw> (rare)
        if node.text and len(node.text.strip()) >= MIN_SIZE:
            return node.text.strip()

        return None
