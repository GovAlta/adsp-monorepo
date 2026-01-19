from schema_generator.form_checkbox import FormCheckbox
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement
from xdp_parser.xdp_utils import Labeling


class XdpCheckbox(XdpElement):
    def __init__(self, xdp, labels, context: ParseContext):
        super().__init__(xdp, labels, context)

    def to_form_element(self):
        label = get_label_with_description(self.get_label())
        return FormCheckbox(
            self.get_name(), self.full_path, "boolean", label, self.context
        )

    def is_control(self):
        return True

    def is_circle_checkbutton(self) -> bool:
        """
        True if this checkbox is visually a radio-style circle checkButton.
        """
        # xdp_element is the <field>
        for cb in self.xdp_element.findall(".//checkButton"):
            mark = (cb.get("mark") or "").strip().lower()
            if mark == "circle":
                return True
        return False

    def get_click_scripts(self) -> list[str]:
        scripts: list[str] = []
        for ev in self.xdp_element.findall(".//{*}event[@activity='click']"):
            for script in ev.findall(".//{*}script"):
                txt = "".join(script.itertext()).strip()
                if txt:
                    scripts.append(txt)
        return scripts


def get_label_with_description(labeling: Labeling) -> str:
    if labeling and labeling.description:
        return f"{labeling.label} - {labeling.description}"
    elif labeling:
        return labeling.label
    return None
