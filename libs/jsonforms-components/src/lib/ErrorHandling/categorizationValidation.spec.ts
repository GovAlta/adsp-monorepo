import {
  errCategorizationHasNoElements,
  errCategorizationHasNonCategories,
  errNoElements,
  getUISchemaErrors,
} from './schemaValidation';

const dataSchema = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
    },
    birthDate: {
      type: 'string',
      format: 'date',
    },
  },
};

const validCategorization = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      elements: [
        {
          type: 'Category',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstName',
            },
          ],
        },
      ],
    },
  ],
  options: { variant: 'stepper' },
};
const categorizationWithNoCategories = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      elements: [{ type: 'Control', scope: '#/properties/firstName' }],
    },
    {
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/birthDate' }],
    },
  ],
  options: { variant: 'stepper' },
};
const categorizationWithNoElements = {
  type: 'Categorization',
  options: { variant: 'stepper' },
};
const categoryHasNoElements = {
  type: 'Categorization',
  elements: [{ type: 'Category' }],
  options: { variant: 'stepper' },
};

describe('check error processing', () => {
  describe('categorization validation', () => {
    it('ignores valid categorizations', () => {
      const err = getUISchemaErrors(validCategorization, dataSchema);
      expect(err).toBe(null);
    });

    it('can detect non-category element', () => {
      const err = getUISchemaErrors(categorizationWithNoCategories, dataSchema);
      expect(err).toMatch(errCategorizationHasNonCategories);
    });

    it('can detect categorization without elements', () => {
      const err = getUISchemaErrors(categorizationWithNoElements, dataSchema);
      expect(err).toMatch(errCategorizationHasNoElements);
    });

    it('can detect a Category with no elements', () => {
      const err = getUISchemaErrors(categoryHasNoElements, dataSchema);
      expect(err).toMatch(errNoElements('Category'));
    });
  });
});
