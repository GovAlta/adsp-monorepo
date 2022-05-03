import { characterCheck, checkInput, validationPattern, wordCheck } from './checkInput';

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

    it('fails with mixed case', () => {
      const checker = characterCheck(validationPattern.mixedKebabCase);
      expect(checker('Its-not_a-kebab')).toBeTruthy();
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
        onFailure: (message: string) => {
          failureActionCalled = true;
        },
      };
      checkInput('the-rain-in-Spain', [charChecker], action);
      expect(failureActionCalled).toEqual(true);
    });

    it('fails on character check', () => {
      const charChecker = characterCheck(validationPattern.lowerKebabCase);
      let successActionCalled = false;

      const action = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onFailure: (message: string) => {},
        onSuccess: () => {
          successActionCalled = true;
        },
      };
      checkInput('the-rain-in-spain', [charChecker], action);
      expect(successActionCalled).toEqual(true);
    });
  });
});
