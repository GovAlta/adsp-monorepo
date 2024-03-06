import { parseSchema } from '../util/schemaUtils';
import {
  errCategorizationHasNoElements,
  errCategorizationHasNoVariant,
  errCategorizationHasNonCategories,
  errNoElements,
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

const validCategorization: string = `
{
  "type": "Categorization",
  "elements": [
    {
      "type": "Category",
      "elements": [
        {
          "type": "Category",
          "elements": [
            {
              "type": "Control",
              "scope": "#/properties/firstName"
            }
          ]
        }
      ]
    }
  ],
  "options": { "variant": "stepper" }
}`;
const categorizationWithNoCategories: string = `
{
  "type": "Categorization",
  "elements": [
    {
      "type": "Category",
      "elements": [{ "type": "Control", "scope": "#/properties/firstName" }]
    },
    {
      "type": "VerticalLayout",
      "elements": [{ "type": "Control", "scope": "#/properties/birthDate" }]
    }
  ],
  "options": { "variant": "stepper" }
}`;
const categorizationWithNoElements: string = `
{
  "type": "Categorization",
  "options": { "variant": "stepper" }
}`;
const categoryHasNoElements: string = `
{
  "type": "Categorization",
  "elements": [{"type":"Category"}],
  "options": { "variant": "stepper" }
}`;
const categorizationWithNoVariant: string = `
{
  "type": "Categorization",
  "elements": [{"type":"Category", "elements":[]}]
}`;

describe('check error processing', () => {
  const dataSchema = parseSchema(data_schema);

  describe('categorization validation', () => {
    it('ignores valid categorizations', () => {
      const schema = parseSchema(validCategorization);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toBe(null);
    });

    it('can detect non-category element', () => {
      const schema = parseSchema(categorizationWithNoCategories);
      const err = getUISchemaErrors(schema, dataSchema);
      console.log(err);
      expect(err).toMatch(errCategorizationHasNonCategories);
    });

    it('can detect categorization without elements', () => {
      const schema = parseSchema(categorizationWithNoElements);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toMatch(errCategorizationHasNoElements);
    });

    it('can detect a Category with no elements', () => {
      const schema = parseSchema(categoryHasNoElements);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toMatch(errNoElements('Category'));
    });

    it('can detect Categorization with no variant', () => {
      const schema = parseSchema(categorizationWithNoVariant);
      const err = getUISchemaErrors(schema, dataSchema);
      expect(err).toMatch(errCategorizationHasNoVariant);
    });
  });
});
