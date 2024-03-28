import Ajv from 'ajv';

export const ajv = new Ajv({ allErrors: true, verbose: true });

ajv.addFormat('file-urn', /^urn:[a-zA-Z0-9.-]+(:[a-zA-Z0-9.-]+)*$/);
