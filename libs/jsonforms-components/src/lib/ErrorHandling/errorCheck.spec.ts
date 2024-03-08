import {
  hasElements,
  hasVariant,
  isCategorization,
  isControlWithNoScope,
  isEmptyElements,
  isKnownType,
  isLayoutType,
  isScopedPrefixed,
  isValidScope,
} from './errorCheck';

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

// Note: The number in the description is the element index, and it
// is used to refer to the element in the unit tests.  Please keep them
// up to date.
const uiSchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/firstName',
      description: 'valid scope test (0)',
    },
    {
      type: 'Control',
      scope: '#/properties/lastName',
      description: 'missing property test (1)',
    },
    {
      type: 'Control',
      scope: '#/properties/birthDate',
      description: 'Date test (2)',
      options: {
        componentProps: {
          name: 'Calendar name',
          min: '2023-02-01',
          max: '2025-02-01',
        },
      },
    },
    {
      type: 'Bob',
      scope: 'properties/bob',
      description: 'malformed scope test (3)',
    },
    {
      type: 'Control',
      description: 'missing scope test (4)',
    },
    {
      type: 'HorizontalLayout',
      description: 'Layout with no elements (5)',
    },
    {
      type: 'VerticalLayout',
      elements: [],
      description: 'Layout with empty elements (6)',
    },
    {
      type: 'Categorization',
      description: 'Valid Categorization (7)',
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
      options: {
        variant: 'stepper',
      },
    },
  ],
};

describe('check error processing', () => {
  describe('data schema', () => {
    it('parses correctly', () => {
      expect(dataSchema).toEqual(
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            firstName: expect.objectContaining({ type: 'string' }),
          }),
        })
      );
    });
  });

  describe('ui schema', () => {
    it('parses correctly', () => {
      expect(uiSchema).toEqual(
        expect.objectContaining({
          type: 'VerticalLayout',
          elements: expect.arrayContaining([
            expect.objectContaining({ scope: expect.stringContaining('#/properties/firstName') }),
            expect.objectContaining({ scope: expect.stringContaining('#/properties/birthDate') }),
          ]),
        })
      );
    });
  });

  describe('testing scope', () => {
    it('can verify valid scope', () => {
      const isValid = isValidScope(uiSchema.elements[0], dataSchema);
      expect(isValid).toBe(true);
    });

    it('can detect missing property', () => {
      const isValid = isValidScope(uiSchema.elements[1], dataSchema);
      expect(isValid).toBe(false);
    });

    it('can detect malformed scope', () => {
      const isValid = isScopedPrefixed(uiSchema.elements[3].scope as string);
      expect(isValid).toBe(false);
    });

    it('can detect missing scope', () => {
      const isValid = isControlWithNoScope(uiSchema.elements[4]);
      expect(isValid).toBe(true);
    });
  });

  describe('testing layout', () => {
    it('can verify a valid layout', () => {
      const isValid = isLayoutType(uiSchema);
      expect(isValid).toBe(true);
    });

    it('can verify layout has elements', () => {
      const isValid = hasElements(uiSchema);
      expect(isValid).toBe(true);
    });

    it('can detect layout without elements', () => {
      const subSchema = uiSchema.elements[5];
      const isValid = isKnownType(subSchema) && hasElements(subSchema);
      expect(isValid).toBe(false);
    });

    it('can detect layout with an empty set of elements', () => {
      const subSchema = uiSchema.elements[6];
      const isValid = isKnownType(subSchema) && isEmptyElements(subSchema);
      expect(isValid).toBe(true);
    });
  });

  describe('testing categorization', () => {
    it('can verify categorization', () => {
      const subSchema = uiSchema.elements[7];
      const isValid = isCategorization(subSchema);
      expect(isValid).toBe(true);
    });

    it('can detect categorization variant', () => {
      const subSchema = uiSchema.elements[7];
      const isValid = hasVariant(subSchema);
      expect(isValid).toBe(true);
    });
  });
});
