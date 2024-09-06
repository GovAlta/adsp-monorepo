import Ajv, { AnySchema } from 'ajv';
import addFormats from 'ajv-formats';

export const createDefaultAjv = (...schemas: AnySchema[]) => {
  const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log'});
  ajv.addSchema(schemas);

  ajv.addFormat('file-urn', /^urn:ads:platform:file-service:v[0-9]:\/files\/[a-zA-Z0-9.-]*$/);
  addFormats(ajv);

  return ajv;
};
