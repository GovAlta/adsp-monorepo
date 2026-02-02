import {
  errMalformedScope,
  errMissingRegister,
  errMissingScope,
  errUnknownScope,
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

const validControl = {
  type: 'Control',
  scope: '#/properties/firstName',
};

const malformedScope = {
  type: 'Control',
  scope: '//properties/firstName',
};

const unknownScope = {
  type: 'Control',
  scope: '#/properties/ouch/unknown/scope',
};

const missingScope = {
  type: 'Control',
};

describe('check error processing', () => {
  describe('control validation', () => {
    it('ignores valid control schema', () => {
      const err = getUISchemaErrors(validControl, dataSchema);
      expect(err).toBe(null);
    });

    it('has malformed scope', () => {
      const err = getUISchemaErrors(malformedScope, dataSchema);
      expect(err).toBe(errMalformedScope(malformedScope.scope));
    });

    it('has unknown scope', () => {
      const err = getUISchemaErrors(unknownScope, dataSchema);
      expect(err).toBe(errUnknownScope(unknownScope.scope));
    });

    it('has missing scope', () => {
      const err = getUISchemaErrors(missingScope, dataSchema);
      expect(err).toBe(errMissingScope);
    });

    it('has missing register', () => {
      const missingRegister = {
        type: 'Control',
        scope: '#/properties/firstName',
        options: {
          format: 'enum',
        },
      };
      const err = getUISchemaErrors(missingRegister, dataSchema);
      expect(err).toBe(errMissingRegister);
    });
  });
});
