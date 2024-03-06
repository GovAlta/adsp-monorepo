import { parseSchema } from '../util/schemaUtils';
import { errMalformedScope, errMissingScope, errUnknownScope, getUISchemaErrors } from './schemaValidation';

const data_schema: string = `
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string"
    },
    "birthDate": {
      "type": "string",
      "format": "date"
    }
  }
}`;

const validControl: string = `
{
  "type": "Control",
  "scope": "#/properties/firstName"
}`;

const malformedScope: string = `
{
  "type": "Control",
  "scope": "#properties/firstName"
}`;

const unknownScope: string = `
{
  "type": "Control",
  "scope": "#/properties/ouch/unknown/scope"
}`;

const missingScope: string = `
{
  "type": "Control"
}`;

describe('check error processing', () => {
  const dataSchema = parseSchema(data_schema);

  describe('control validation', () => {
    it('ignores valid control schema', () => {
      const schema = parseSchema(validControl);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(null);
    });

    it('has malformed scope', () => {
      const schema = parseSchema(malformedScope);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errMalformedScope(schema.scope));
    });

    it('has unknown scope', () => {
      const schema = parseSchema(unknownScope);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errUnknownScope(schema.scope));
    });

    it('has missing scope', () => {
      const schema = parseSchema(missingScope);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errMissingScope);
    });
  });
});
