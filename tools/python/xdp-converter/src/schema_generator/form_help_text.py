import re
from schema_generator.form_element import FormElement
from xdp_parser.parse_context import ParseContext


class FormHelpText(FormElement):
    def __init__(self, help_content, context: ParseContext):
        super().__init__("information", None, None, context)
        self.can_group_horizontally = False
        self.help = help_content
        # if isinstance(help_content, str):
        #     self.help = help_content
        # elif hasattr(help_content, "text") and help_content.text:
        #     self.help = help_content.text
        # else:
        #     self.help = html_to_markdown(help_content)

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
