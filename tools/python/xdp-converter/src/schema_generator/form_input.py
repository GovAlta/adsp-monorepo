from typing import Optional

from schema_generator.form_element import FormElement, JsonSchemaElement, UISchema
from xdp_parser.parse_context import ParseContext
from xdp_parser.xdp_utils import strip_label_prefix


class FormInput(FormElement):
    def __init__(
        self,
        name: str,
        qualified_name,
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
        self.label: str = label

    def has_json_schema(self) -> bool:
        return True

    def to_json_schema(self) -> list[JsonSchemaElement]:
        json_schema: JsonSchemaElement = {"type": self.input_type}
        if self.label:
            json_schema["title"] = strip_label_prefix(self.label)
        if self.enum:
            json_schema["enum"] = self.enum
        if self.format:
            json_schema["format"] = self.format
        return [json_schema]

    def build_ui_schema(self) -> JsonSchemaElement:
        control: UISchema = {"type": "Control", "scope": f"#/properties/{self.name}"}
        control["label"] = strip_label_prefix(self.label) if self.label else ""
        if self.is_radio:
            control["options"] = {"format": "radio"}
        return control
