import Ajv, { AnySchema } from 'ajv';
import addErrors from 'ajv-errors';
import addFormats from 'ajv-formats';

export const createDefaultAjv = (...schemas: AnySchema[]) => {
  const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log', strictRequired: false });
  ajv.addSchema(schemas);

  addErrors(ajv);
  addFormats(ajv);

  ajv.addFormat('file-urn', /^urn:ads:platform:file-service:v[0-9]:\/files\/[a-zA-Z0-9.-]*$/);
  ajv.addFormat('time', /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

  return ajv;
};
