import { characterCheck, checkInput, validateJsonSchema, validationPattern, wordCheck } from './checkInput';

describe('checkInput', () => {
  describe('character check', () => {
    it('succeeds with valid string', () => {
      const checker = characterCheck(validationPattern.lowerKebabCase);
      expect(checker('its-a-kebab')).toBeFalsy();
    });

    it('fails with invalid string', () => {
      const checker = characterCheck(validationPattern.upperKebabCase);
      expect(checker('Its-a-kebab')).toBeTruthy();
    });

    it('succeeds with mixed case', () => {
      const checker = characterCheck(validationPattern.mixedKebabCase);
      expect(checker('Its-a-kebab')).toBeFalsy();
    });

    it('Succeeds with mixed case', () => {
      const checker = characterCheck(validationPattern.mixedKebabCase);
      expect(checker('Its-not_a-kebab')).toBeFalsy();
    });

    it('succeeds with valid URL', () => {
      const checker = characterCheck(validationPattern.validURL);
      expect(checker('https://google.com')).toBeFalsy();
    });

    it('fails with invalid URL', () => {
      const checker = characterCheck(validationPattern.validURL);
      expect(checker('Its-not_a-kebab')).toBeTruthy();
    });

    it('fails with invalid URL', () => {
      const checker = characterCheck(validationPattern.validURL);
      expect(checker('http:Its-not_a-kebab')).toBeTruthy();
    });

    it('fails with invalid URL', () => {
      const checker = characterCheck(validationPattern.validURL);
      expect(checker('http://Its-"not"_a-kebab')).toBeTruthy();
    });
  });

  describe('word check', () => {
    it('fails with bad word', () => {
      const checker = wordCheck(['apple', 'banana']);
      expect(checker('apple')).toBeTruthy();
    });

    it('succeeds with good word', () => {
      const checker = wordCheck(['apple', 'banana']);
      expect(checker('cheeseCake')).toBeFalsy();
    });
  });

  describe('multi check', () => {
    it('succeeds with all checks', () => {
      const wordChecker = wordCheck(['apple', 'banana']);
      const charChecker = characterCheck(validationPattern.mixedKebabCase);

      expect(checkInput('the-rain-in-Spain', [wordChecker, charChecker])).toBeFalsy();
    });

    it('fails on character check', () => {
      const wordChecker = wordCheck(['apple_banana']);
      const charChecker = characterCheck(validationPattern.mixedKebabCase);

      expect(checkInput('apple_banana', [wordChecker, charChecker])).toBeTruthy();
    });

    it('fails on word check', () => {
      const wordChecker = wordCheck(['apple-banana']);
      const charChecker = characterCheck(validationPattern.mixedKebabCase);

      expect(checkInput('apple-banana', [wordChecker, charChecker])).toBeTruthy();
    });
  });

  describe('action test', () => {
    it('calls action on failure', () => {
      const charChecker = characterCheck(validationPattern.lowerKebabCase);
      let failureActionCalled = false;
      const action = {
        onFailure: (_message: string) => {
          failureActionCalled = true;
        },
      };
      checkInput('the-rain-in-Spain', [charChecker], action);
      expect(failureActionCalled).toEqual(true);
    });

    it('calls action on success', () => {
      const charChecker = characterCheck(validationPattern.lowerKebabCase);
      let successActionCalled = false;

      const action = {
        onFailure: (_message: string) => {},
        onSuccess: () => {
          successActionCalled = true;
        },
      };
      checkInput('the-rain-in-spain', [charChecker], action);
      expect(successActionCalled).toEqual(true);
    });
  });

  describe('validateJsonSchema', () => {
    it('returns valid for a valid JSON schema', () => {
      const result = validateJsonSchema(
        JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        })
      );

      expect(result).toEqual({ valid: true });
    });

    it('returns required error for empty schema text', () => {
      expect(validateJsonSchema('   ')).toEqual({
        valid: false,
        error: 'Payload schema is required.',
      });
    });

    it('returns JSON error for malformed schema text', () => {
      expect(validateJsonSchema('{ "type": "object"')).toEqual({
        valid: false,
        error: 'Payload schema must be valid JSON.',
      });
    });

    it('returns a helpful error for an invalid schema type', () => {
      expect(validateJsonSchema(JSON.stringify({ type: 'objectx' }))).toEqual({
        valid: false,
        error: 'Invalid schema type "objectx". Allowed types are: object, array, string, number, integer, boolean, and null.',
      });
    });

    it('returns a schema validation error for other invalid schemas', () => {
      const result = validateJsonSchema(
        JSON.stringify({
          type: 'object',
          required: 'name',
        })
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON Schema: /required');
    });
  });
});
