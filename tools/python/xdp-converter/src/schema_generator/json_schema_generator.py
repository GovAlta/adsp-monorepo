from typing import List

from schema_generator.form_element import FormElement

class JsonSchemaGenerator:

    def to_schema(self, inputs: List[FormElement]):
        properties = {}
        required = []
        self.get_properties(inputs, properties, required)
        return {
            "type": "object",
            "properties": properties,
            "required": required
        }

    def get_properties(self, element, properties, required):
        if isinstance(element, list):
            for e in element:
                self.get_properties(e, properties, required)
        elif element.is_leaf:
            properties[element.name] = element.to_json_schema()
            if element.name not in required:
                required.append(element.name)
        else:
            for e in element.elements:
                self.get_properties(e, properties, required)
