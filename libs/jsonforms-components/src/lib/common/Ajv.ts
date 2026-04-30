import Ajv, { AnySchema } from 'ajv';
import addErrors from 'ajv-errors';
import addFormats from 'ajv-formats';
import { PHONE_REGEX } from '../Controls';
import { validateSinWithLuhn } from '../util';
import { invalidSin } from './Constants';

export const createDefaultAjv = (...schemas: AnySchema[]) => {
  const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log', strictRequired: false, useDefaults: true });
  ajv.addSchema(schemas);

  addErrors(ajv);
  addFormats(ajv);

  ajv.addFormat('time', /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);
  ajv.addFormat('phone', PHONE_REGEX);
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

  ajv.addKeyword({
    keyword: 'validSin',
    type: 'string',
    schemaType: 'boolean',
    validate: (shouldValidate: boolean, data: unknown) => {
      if (!shouldValidate) return true;

      if (typeof data !== 'string' || data.length === 0) {
        return true;
      }

      if (!/^\d{3} \d{3} \d{3}$/.test(data)) {
        return true;
      }

      return validateSinWithLuhn(data);
    },
    error: {
      message: invalidSin,
    },
  });

  return ajv;
};
