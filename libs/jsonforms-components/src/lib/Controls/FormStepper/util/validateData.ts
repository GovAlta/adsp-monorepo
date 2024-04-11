import { JsonSchema } from '@jsonforms/core';
import { getData } from '../../../Context';
import { Ajv } from 'ajv';

export const validateData = (jsonSchema: JsonSchema, data: unknown, ajv: Ajv): boolean => {
  const newSchema = JSON.parse(JSON.stringify(jsonSchema));

  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    property[propertyName].enum = getData(propertyName) as string[];
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
