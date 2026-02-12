from typing import Optional
from schema_generator.form_checkbox import FormCheckbox
from xdp_parser.display_text import DisplayText
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_element import XdpElement

debug = False


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

    def get_label(self) -> Optional[DisplayText]:
        label = super().get_label()
        if debug:
            print(f"  Checkbox label: {label}")
        return label

    def get_click_scripts(self) -> list[str]:
        scripts: list[str] = []
        for ev in self.xdp_element.findall(".//{*}event[@activity='click']"):
            for script in ev.findall(".//{*}script"):
                txt = "".join(script.itertext()).strip()
                if txt:
                    scripts.append(txt)
        return scripts


def get_label_with_description(display_text: DisplayText) -> str:
    if display_text and display_text.description:
        return f"{display_text.label} - {display_text.description}"
    elif display_text:
        return display_text.label
    return None
