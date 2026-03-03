from typing import List

from schema_generator.form_element import FormElement


class JsonSchemaGenerator:

    def to_schema(self, inputs: List[FormElement]):
        properties = {}
        required = []
        self.get_properties(inputs, properties, required)
        return {"type": "object", "properties": properties, "required": required}

    def get_properties(self, element, properties, required):
        if isinstance(element, list):
            for e in element:
                self.get_properties(e, properties, required)
            return

        if element.is_leaf:
            if element.has_json_schema() and element.name:
                schemas = element.to_json_schema()  # list now
                if not schemas:
                    return
                # leaf should only ever yield one schema
                properties[element.name] = schemas[0]
            return

        for e in element.get_children():
            self.get_properties(e, properties, required)
