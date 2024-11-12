import { JsonSchema } from '@jsonforms/core';
import Ajv from 'ajv';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateData = (jsonSchema: JsonSchema, data: any, ajv: Ajv): boolean => {
  const newSchema = JSON.parse(JSON.stringify(jsonSchema));

  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    if (property[propertyName]?.enum && property[propertyName]?.enum[0] === '') {
      delete property[propertyName]?.enum;
    }

    if (property[propertyName]?.format === 'file-urn') {
      delete property[propertyName].format;
    }
    if (property[propertyName]?.title === 'Social insurance number' && data && data[propertyName] === '') {
      delete data[propertyName];
    }
  });

  try {
    const validate = ajv.compile(newSchema as JsonSchema);
    return validate(data).valueOf() as boolean;
  } catch (e) {
    return false;
  }
};
