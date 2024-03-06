import { parseSchema } from '../util/schemaUtils';
import { errNoElements, getUISchemaErrors } from './schemaValidation';

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

const validLayout: string = `
{
  "type": "VerticalLayout",
  "elements": [ { "type": "Control", "scope": "#/properties/firstName" } ]
}`;

const hasNoElements: string = `
{
  "type": "HorizontalLayout"
}
`;

const hasEmptyElement: string = `
{
  "type": "HorizontalLayout",
  "elements":[]
}
`;

describe('check error processing', () => {
  const dataSchema = parseSchema(data_schema);

  describe('layout validation', () => {
    it('ignores valid layout schema', () => {
      const schema = parseSchema(validLayout);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(null);
    });

    it('has no elements', () => {
      const schema = parseSchema(hasNoElements);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errNoElements(schema.type));
    });

    it('has empty elements', () => {
      const schema = parseSchema(hasEmptyElement);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(errNoElements(schema.type));
    });
  });
});
