from schema_generator.form_help_text import FormHelpText
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_subform import get_subform_label
from xdp_parser.xdp_utils import strip_units


class XdpHelpText(XdpElement):
    def __init__(self, xdp_element):
        super().__init__(xdp_element)

    def to_form_element(self):
        return FormHelpText(self.xdp_element)

    @staticmethod
    def get_help_text(draw_node):
        MIN_SIZE = 30
        # Must be a <draw> with a text block (not a field)
        if draw_node.tag != "draw":
            return None
        if draw_node.find(".//ui/textEdit") is None:
            return None

        # Must contain HTML text
        exdata = draw_node.find(".//value/exData[@contentType='text/html']")
        if exdata is None:
            return None

        # Ignore nodes that participate in data binding or scripting
        if any(
            draw_node.findall(f".//{tag}") for tag in ("bind", "calculate", "event")
        ):
            return None

        # Extract and normalize text
        text = " ".join(exdata.itertext()).strip()
        if len(text) < MIN_SIZE:
            return None  # too short to be instructional

        name = draw_node.get("name", "").lower()
        width = float(strip_units(draw_node.get("w", "0")) or 0)
        text_lower = text.lower()

        # Name hint (labels, info, notes)
        name_hint = any(prefix in name for prefix in ("lbl", "info", "note", "instr"))

        # Keyword hint (common in help text)
        keywords = [
            "please",
            "information",
            "contact",
            "fax",
            "mail",
            "submit",
            "application",
            "call",
            "phone",
            "provided",
            "eligibility",
        ]
        keyword_hint = any(word in text_lower for word in keywords)

        # Heuristic threshold: wide + long text or a strong hint
        if width > 150 or name_hint or keyword_hint:
            return exdata

        return None
