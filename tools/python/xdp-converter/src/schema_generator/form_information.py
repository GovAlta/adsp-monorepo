from schema_generator.form_element import FormElement
import re


class FormInformation(FormElement):
    def __init__(self, element_name, text, option, style="", hidden=False):
        super().__init__("information")
        self.help = text
        self.element_name = element_name
        self.style = style
        self.hidden = hidden
        self.option = option

    def to_ui_schema(self):
        if not self.help:
            return None
        ui_schema = {"type": "HelpContent"}
        if self.element_name:
            ui_schema["label"] = f"{self.element_name}"
        ui_schema["options"] = {
            "markdown": "true",
            "variant": "detail",
            "help": f"{self.style}{capitalize_first(self.help)}",
        }
        if self.hidden:
            ui_schema["rule"] = self._add_rule(self.element_name, self.option)
        return ui_schema

    def _add_rule(self, name, value):
        return {
            "effect": "SHOW",
            "condition": {"scope": f"#/properties/{name}", "schema": {"const": value}},
        }

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
