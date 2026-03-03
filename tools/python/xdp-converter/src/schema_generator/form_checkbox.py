from typing import Optional

from schema_generator.form_element import FormElement, JsonSchemaElement, UISchema
from xdp_parser.parse_context import ParseContext


class FormCheckbox(FormElement):
    def __init__(
        self,
        name: str,
        qualified_name: str,
        input_type: str,
        label: str,
        context: ParseContext,
    ):
        super().__init__("control", name, qualified_name, context)
        self.input_type: str = input_type
        self.format: Optional[str] = None
        self.x: Optional[float] = None
        self.y: Optional[float] = None
        self.is_radio = False
        self.label: str = ""
        self.desc: str = label

    def has_json_schema(self):
        return True

    def to_json_schema(self) -> list[JsonSchemaElement]:
        json_schema: JsonSchemaElement = {"type": self.input_type}
        if self.desc:
            json_schema["description"] = self.desc
        if self.format:
            json_schema["format"] = self.format
        return [json_schema]

    def build_ui_schema(self) -> Optional[UISchema]:
        control: UISchema = {
            "type": "Control",
            "label": "",
            "scope": f"#/properties/{self.name}",
        }
        return control
