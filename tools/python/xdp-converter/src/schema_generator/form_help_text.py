import re
from schema_generator.form_element import FormElement
from xdp_parser.parse_context import ParseContext


class FormHelpText(FormElement):
    def __init__(
        self, name: str, qualified_name: str, help_content, context: ParseContext
    ):
        super().__init__("information", name, qualified_name, context)
        self.can_group_horizontally = False
        self.help = help_content

    def build_ui_schema(self):
        if not self.help:
            return None
        ui_schema = {"type": "HelpContent"}
        ui_schema["options"] = {
            "markdown": True,
            "help": self.help,
        }
        return ui_schema

    def has_json_schema(self):
        return False

    def to_json_schema(self):
        return None
