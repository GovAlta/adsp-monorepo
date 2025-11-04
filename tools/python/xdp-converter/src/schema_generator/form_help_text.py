import re
from schema_generator.form_element import FormElement
from schema_generator.html_to_markdown import html_to_markdown


class FormHelpText(FormElement):
    def __init__(self, exdata):
        super().__init__("information", None, None)
        self.can_group_horizontally = False
        # 🧩 Handle either plain text or ElementTree nodes
        if isinstance(exdata, str):
            self.help = exdata
        elif hasattr(exdata, "text") and exdata.text:
            self.help = exdata.text
        else:
            self.help = html_to_markdown(exdata)

    def build_ui_schema(self):
        if not self.help:
            return None
        ui_schema = {"type": "HelpContent"}
        ui_schema["options"] = {
            "markdown": "true",
            "help": self.help,
        }
        return ui_schema

    def has_json_schema(self):
        return False

    def to_json_schema(self):
        return None


def split_camel_case(s):
    words = re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?=[A-Z]|$)", s)
    return " ".join(words)


def capitalize_first(s: str) -> str:
    s = s.strip()
    if not s:
        return s
    return s[0].upper() + s[1:]
