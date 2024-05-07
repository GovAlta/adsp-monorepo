import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';

export const getAllRequiredFields = (schema: JsonSchema4 | JsonSchema7): string[] => {
  const requiredFields: string[] = [];

  function findRequired(fields: JsonSchema4 | JsonSchema7) {
    if (fields && fields.required && Array.isArray(fields.required)) {
      fields.required.forEach((field: string) => {
        requiredFields.push(field);
      });
    }

    if (fields !== undefined && fields.properties) {
      Object.keys(fields.properties).forEach((key) => {
        if (fields.properties) {
          findRequired(fields.properties[key]);
        }
      });
    } else if (fields && fields.type === 'array' && fields.items && typeof fields.items === 'object') {
      const childItems: JsonSchema4 = JSON.parse(JSON.stringify(fields.items));
      findRequired(childItems);
    }
  }
  findRequired(schema);
  return requiredFields;
};
