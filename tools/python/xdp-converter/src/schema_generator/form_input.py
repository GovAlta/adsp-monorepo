from schema_generator.form_element import FormElement
from xdp_parser.xdp_utils import strip_label_prefix


class FormInput(FormElement):
    def __init__(self, name: str, input_type: str = "string"):
        super().__init__("control")
        self.name: str = name
        self.input_type: str = input_type
        self.label: str = strip_label_prefix(name)
        self.format: str = None
        self.enum: list[str] = None
        self.x: float = None
        self.y: float = None
        self.is_radio = False

    def has_json_schema(self):
        return True

    def to_json_schema(self):
        json_schema = {"type": self.input_type}
        if self.enum:
            if self.is_radio:
                print(f"FormInput.to_json_schema: Setting is_radio for {self.name}")
            json_schema["enum"] = self.enum
        if self.format:
            json_schema["format"] = self.format
        return json_schema

    def to_ui_schema(self):
        control = {"type": "Control", "scope": f"#/properties/{self.name}"}
        if self.label:
            control["label"] = self.label
        if self.is_radio:
            control["options"] = {"format": "radio"}
        return control
