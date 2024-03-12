import { UISchemaElement } from '@jsonforms/core';
import {
  errMissingScope,
  errMissingType,
  errUnknownScope,
  errUnknownType,
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

const missingType = {
  elements: [{ type: 'Control', scope: '#/properties/firstName' }],
};

const unknownType = {
  type: 'BobsYerUncle',
  elements: [{ type: 'Control', scope: '#/properties/firstName' }],
};

const validListWithDetails = {
  type: 'ListWithDetail',
  scope: '#/properties/firstName',
};
const listWithDetailsNoScope = {
  type: 'ListWithDetail',
};

const listWithDetailsInvalidScope = {
  type: 'ListWithDetail',
  scope: '#/properties/Yabadabadooo',
};

describe('check error processing', () => {
  describe('type validation', () => {
    it('detects missing type', () => {
      const err = getUISchemaErrors(missingType as unknown as UISchemaElement, dataSchema);
      expect(err).toBe(errMissingType);
    });

    it('detects unknown type', () => {
      const err = getUISchemaErrors(unknownType, dataSchema);
      expect(err).toBe(errUnknownType(unknownType.type));
    });
  });

  describe('List with Detail validation', () => {
    it('likes valid ListWithDetails', () => {
      const err = getUISchemaErrors(validListWithDetails, dataSchema);
      expect(err).toBe(null);
    });

    it('detects no scope', () => {
      const err = getUISchemaErrors(listWithDetailsNoScope, dataSchema);
      expect(err).toBe(errMissingScope);
    });

    it('detects unknown scope', () => {
      const err = getUISchemaErrors(listWithDetailsInvalidScope, dataSchema);
      expect(err).toBe(errUnknownScope(listWithDetailsInvalidScope.scope));
    });
  });
});
