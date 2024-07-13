import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const createDefaultAjv = () => {
  const ajv = new Ajv({ allErrors: true, verbose: true, strict: 'log' });
  ajv.addFormat('file-urn', /^urn:ads:platform:file-service:v[0-9]:\/files\/[a-zA-Z0-9.-]*$/);
  addFormats(ajv);
  return ajv;
};
