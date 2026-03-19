import { autoPopulateValue, autoPopulatePropertiesMonaco, USER_FIELD_DEFINITIONS } from './autoPopulate';
import { User } from '../Context/register';

describe('USER_FIELD_DEFINITIONS', () => {
  const mockUser: User = {
    name: 'John Doe',
    email: 'john@example.com',
  } as User;

  describe('autoPopulateValue', () => {
    it('returns full name for fullName', () => {
      expect(autoPopulateValue(mockUser, { path: 'fullName' })).toBe('John Doe');
    });

    it('returns full name for name alias', () => {
      expect(autoPopulateValue(mockUser, { path: 'name' })).toBe('John Doe');
    });

    it('returns first name', () => {
      expect(autoPopulateValue(mockUser, { path: 'firstName' })).toBe('John');
    });

    it('returns first name for givenName alias', () => {
      expect(autoPopulateValue(mockUser, { path: 'givenName' })).toBe('John');
    });

    it('returns last name', () => {
      expect(autoPopulateValue(mockUser, { path: 'lastName' })).toBe('Doe');
    });

    it('returns last name for surname alias', () => {
      expect(autoPopulateValue(mockUser, { path: 'surname' })).toBe('Doe');
    });

    it('returns email', () => {
      expect(autoPopulateValue(mockUser, { path: 'email' })).toBe('john@example.com');
    });

    it('returns email for alias fields', () => {
      expect(autoPopulateValue(mockUser, { path: 'emailAddress' })).toBe('john@example.com');
      expect(autoPopulateValue(mockUser, { path: 'primaryEmail' })).toBe('john@example.com');
    });

    it('returns empty string if email is missing', () => {
      const userWithoutEmail = { name: 'John Doe' } as User;
      expect(autoPopulateValue(userWithoutEmail, { path: 'email' })).toBe('');
    });

    it('handles single name (no last name)', () => {
      const user = { name: 'Prince' } as User;
      expect(autoPopulateValue(user, { path: 'firstName' })).toBe('Prince');
      expect(autoPopulateValue(user, { path: 'lastName' })).toBe('');
    });

    it('returns undefined for unknown field', () => {
      expect(autoPopulateValue(mockUser, { path: 'unknownField' })).toBeUndefined();
    });
  });

  describe('autoPopulatePropertiesMonaco', () => {
    it('creates an entry for each field definition', () => {
      const keys = Object.keys(USER_FIELD_DEFINITIONS);
      expect(autoPopulatePropertiesMonaco).toHaveLength(keys.length);
    });

    it('generates labels with auto suffix', () => {
      const item = autoPopulatePropertiesMonaco.find((i) => i.label.includes('fullName'));
      expect(item?.label).toBe('fullName (auto from user profile)');
    });

    it('generates valid insertText JSON structure', () => {
      const item = autoPopulatePropertiesMonaco.find((i) => i.label.includes('email'));
      expect(item?.insertText).toContain('"type": "string"');
      expect(item?.insertText).toContain('"format": "email"');
    });

    it('includes properly formatted key in insertText', () => {
      const item = autoPopulatePropertiesMonaco.find((i) => i.label.startsWith('firstName'));
      expect(item?.insertText.startsWith('firstName"')).toBe(true);
    });
  });
});
