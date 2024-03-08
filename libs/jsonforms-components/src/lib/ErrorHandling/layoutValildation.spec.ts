import { errNoElements, getUISchemaErrors } from './schemaValidation';

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

const validLayout = {
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/firstName' }],
};

const hasNoElements = {
  type: 'HorizontalLayout',
};

const hasEmptyElement = {
  type: 'HorizontalLayout',
  elements: [],
};

describe('check error processing', () => {
  describe('layout validation', () => {
    it('ignores valid layout schema', () => {
      const err = getUISchemaErrors(validLayout, dataSchema);
      expect(err).toBe(null);
    });

    it('has no elements', () => {
      const err = getUISchemaErrors(hasNoElements, dataSchema);
      expect(err).toBe(errNoElements(hasNoElements.type));
    });

    it('has empty elements', () => {
      const err = getUISchemaErrors(hasEmptyElement, dataSchema);
      expect(err).toBe(errNoElements(hasEmptyElement.type));
    });
  });
});
