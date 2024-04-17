import { JsonSchema } from '@jsonforms/core';
import Ajv from 'ajv8';

export const validateData = (jsonSchema: JsonSchema, data: unknown, ajv: Ajv): boolean => {
  const newSchema = JSON.parse(JSON.stringify(jsonSchema));

  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    if (property[propertyName]?.enum && property[propertyName]?.enum[0] === '') {
      delete property[propertyName]?.enum;
    }

    if (property[propertyName]?.format === 'file-urn') {
      delete property[propertyName].format;
    }
  });

  try {
    const validate = ajv.compile(newSchema as JsonSchema);
    return validate(data).valueOf() as boolean;
  } catch (e) {
    return false;
  }
};
