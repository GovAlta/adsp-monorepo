import Ajv from 'ajv8';


export interface ValidInput {
  pattern: RegExp;
  onFailureMessage: string;
}

export const ajv = new Ajv({ allErrors: true, verbose: true });


ajv.addFormat('file-urn', /urn:[^:]+:[^:]+:[^:]+:[^:]+/);