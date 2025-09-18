from schema_generator.form_element import FormElement
import re


class FormInformation(FormElement):
    def __init__(self, label, text):
        super().__init__("information")
        self.help = text
        self.label = label

    def to_ui_schema(self):
        if not self.help:
            return None
        ui_schema = {"type": "HelpContent"}
        if self.label:
            ui_schema["label"] = f"{self.label}"
        ui_schema["options"] = {
            "markdown": "true",
            "variant": "detail",
            "help": f"## {split_camel_case(self.help)}",
        }
        return ui_schema

    def has_json_schema(self):
        return False

    def to_json_schema(self):
        return None


def split_camel_case(s):
    words = re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?=[A-Z]|$)", s)
    return " ".join(words)
