import Ajv, { AnySchema } from 'ajv';
import addErrors from 'ajv-errors';
import addFormats from 'ajv-formats';

export const createDefaultAjv = (...schemas: AnySchema[]) => {
  const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log', strictRequired: false, useDefaults: true });
  ajv.addSchema(schemas);

  addErrors(ajv);
  addFormats(ajv);

  ajv.addFormat('time', /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
  ajv.addFormat('computed', /^[a-zA-Z0-9._-]+$/);
  ajv.addFormat('file-urn', {
    type: 'string',
    validate: (input) => {
      const fileUrnRegExp = new RegExp('^urn:ads:platform:file-service:v[0-9]:/files/[a-zA-Z0-9.-]*$');
      const fileUrns = input.split(';');
      for (const urn of fileUrns) {
        if (!fileUrnRegExp.test(urn)) {
          return false;
        }
      }
      return true;
    },
  });
  return ajv;
};
