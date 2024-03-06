import { parseSchema } from '../util/schemaUtils';
import {
  errMissingScope,
  errMissingType,
  errUnknownScope,
  errUnknownType,
  getUISchemaErrors,
} from './schemaValidation';

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

const missingType: string = `
{
  "elements": [ { "type": "Control", "scope": "#/properties/firstName" } ]
}`;

const unknownType: string = `
{
  "type": "BobsYerUncle",
  "elements": [ { "type": "Control", "scope": "#/properties/firstName" } ]
}`;

const validListWithDetails = `
{
  "type": "ListWithDetail",
  "scope": "#/properties/firstName"
}
`;
const listWithDetailsNoScope = `
{
  "type": "ListWithDetail"
}
`;

const listWithDetailsInvalidScope = `
{
  "type": "ListWithDetail",
  "scope": "#/properties/Yabadabadooo"
}
`;
describe('check error processing', () => {
  const dataSchema = parseSchema(data_schema);

  describe('type validation', () => {
    it('detects missing type', () => {
      const schema = parseSchema(missingType);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errMissingType);
    });

    it('detects unknown type', () => {
      const schema = parseSchema(unknownType);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errUnknownType(schema.type));
    });
  });

  describe('List with Detail validation', () => {
    it('likes valid ListWithDetails', () => {
      const schema = parseSchema(validListWithDetails);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(null);
    });

    it('detects no scope', () => {
      const schema = parseSchema(listWithDetailsNoScope);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errMissingScope);
    });

    it('detects unknown scope', () => {
      const schema = parseSchema(listWithDetailsInvalidScope);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errUnknownScope(schema.scope));
    });
  });
});
