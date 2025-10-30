from schema_generator.form_element import FormElement
import re


class SectionTitle(FormElement):
    def __init__(self, text):
        super().__init__("guidance", None, None)
        self.help = text
        self.label = None

    def build_ui_schema(self):
        ui_schema = {"type": "HelpContent"}
        if self.label:
            ui_schema["label"] = f"{self.label}"
        if self.help:
            ui_schema["options"] = {
                "markdown": "true",
                "help": f"## {self.help}",
            }
        return ui_schema

    def has_json_schema(self):
        return False

    def to_json_schema(self):
        return None


def split_camel_case(s):
    words = re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?=[A-Z]|$)", s)
    return " ".join(words)
