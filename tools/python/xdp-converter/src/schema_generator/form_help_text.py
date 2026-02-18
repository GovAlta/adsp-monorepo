import re
from schema_generator.form_element import FormElement, JsonSchemaElement
from xdp_parser.parse_context import ParseContext


class FormHelpText(FormElement):
    def __init__(
        self,
        name: str,
        qualified_name: str,
        help_content,
        is_header: bool,
        context: ParseContext,
    ):
        super().__init__("information", name, qualified_name, context)
        self.can_group_horizontally = False
        self.help = help_content
        self.is_header = is_header

    def build_ui_schema(self) -> JsonSchemaElement:
        if not self.help:
            return None
        ui_schema = {"type": "HelpContent"}
        header_text = self.help
        if self.is_header:
            header_text = f"## {self.help}"

        ui_schema["options"] = {
            "markdown": True,
            "help": header_text,
        }
        return ui_schema

    def has_json_schema(self):
        return False

    def to_json_schema(self) -> JsonSchemaElement:
        return None
