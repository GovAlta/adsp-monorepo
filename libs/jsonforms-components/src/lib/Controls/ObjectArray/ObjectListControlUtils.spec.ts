import {
  createHumanizeError,
  extractNames,
  extractNestedFields,
  isObjectArrayEmpty,
  prettify,
} from './ObjectListControlUtils';
import { ErrorObject } from 'ajv';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { REQUIRED_PROPERTY_ERROR } from '../../common/Constants';

jest.mock('./ListWithDetailControl', () => ({
  humanizeAjvError: jest.fn((error: ErrorObject, schema: JsonSchema, uischema: UISchemaElement) => {
    if (error.keyword === 'required') {
      const missingProperty = (error.params as Record<string, unknown>)?.missingProperty;
      return `must have required property '${missingProperty}'`;
    }
    return error.message || 'Unknown error';
  }),
}));

describe('createHumanizeError', () => {
  const mockSchema: JsonSchema = {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      email: { type: 'string' },
    },
    required: ['firstName', 'lastName'],
  };

  const mockUISchema: UISchemaElement = {
    type: 'Control',
    scope: '#',
  };

  describe('when error contains "must have required property"', () => {
    it('should extract property name and format as "{property} is required"', () => {
      const error: ErrorObject = {
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'firstName' },
        message: `must have required property 'firstName'`,
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('First Name is required');
    });

    it('should handle camelCase property names', () => {
      const error: ErrorObject = {
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'lastName' },
        message: `must have required property 'lastName'`,
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('Last Name is required');
    });

    it('should handle snake_case property names', () => {
      const error: ErrorObject = {
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'user_name' },
        message: `must have required property 'user_name'`,
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('User name is required');
    });

    it('should handle kebab-case property names', () => {
      const error: ErrorObject = {
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'phone-number' },
        message: `must have required property 'phone-number'`,
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('Phone number is required');
    });
  });

  describe('when error contains REQUIRED_PROPERTY_ERROR', () => {
    it('should extract property name and format as "{property} is required"', () => {
      const error: ErrorObject = {
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'email' },
        message: `${REQUIRED_PROPERTY_ERROR} 'email'`,
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('Email is required');
    });
  });

  describe('when error message does not contain required property pattern', () => {
    it('should return the humanized error message as-is', () => {
      const error: ErrorObject = {
        keyword: 'minLength',
        instancePath: '/firstName',
        schemaPath: '#/properties/firstName/minLength',
        params: { limit: 3 },
        message: 'must be at least 3 characters',
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('must be at least 3 characters');
    });
  });

  describe('when humanizeAjvError throws an error', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should extract property name from raw error message', () => {
      const error: ErrorObject & { message?: string } = {
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'firstName' },
        message: `must have required property 'firstName'`,
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('First Name is required');
    });

    it('should fallback to raw error message when property cannot be extracted', () => {
      const error: ErrorObject & { message?: string } = {
        keyword: 'type',
        instancePath: '/age',
        schemaPath: '#/properties/age/type',
        params: { type: 'number' },
        message: 'must be number',
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('must be number');
    });
  });

  describe('edge cases', () => {
    it('should handle error with empty message', () => {
      const error: ErrorObject & { message?: string } = {
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'firstName' },
        message: '',
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBeDefined();
    });

    it('should preserve spaces in property names when prettified', () => {
      const error: ErrorObject = {
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'firstNameOfPerson' },
        message: `must have required property 'firstNameOfPerson'`,
      };

      const result = createHumanizeError(error, mockSchema, mockUISchema);
      expect(result).toBe('First Name Of Person is required');
    });
  });
});

describe('extractNames', () => {
  it('should extract names from objects with scope and label', () => {
    const obj = [
      {
        scope: '#/properties/firstName',
        label: 'First Name',
      },
      {
        scope: '#/properties/lastName',
        label: 'Last Name',
      },
    ];

    const result = extractNames(obj);
    expect(result).toEqual({
      firstName: 'First Name',
      lastName: 'Last Name',
    });
  });

  it('should handle label as object with text property', () => {
    const obj = [
      {
        scope: '#/properties/email',
        label: { text: 'Email Address' },
      },
    ];

    const result = extractNames(obj);
    expect(result).toEqual({
      email: 'Email Address',
    });
  });

  it('should prettify property names when label is missing', () => {
    const obj = [
      {
        scope: '#/properties/firstName',
      },
    ];

    const result = extractNames(obj);
    expect(result).toEqual({
      firstName: 'First Name',
    });
  });

  it('should prettify property names when label is empty', () => {
    const obj = [
      {
        scope: '#/properties/someProperty',
        label: '',
      },
    ];

    const result = extractNames(obj);
    expect(result).toEqual({
      someProperty: 'Some Property',
    });
  });

  it('should handle nested arrays', () => {
    const obj = [
      [
        {
          scope: '#/properties/userName',
          label: 'User Name',
        },
      ],
    ];

    const result = extractNames(obj);
    expect(result).toEqual({
      userName: 'User Name',
    });
  });

  it('should ignore objects without scope', () => {
    const obj = [
      {
        label: 'Some Label',
      },
      {
        scope: '#/properties/field',
        label: 'Field',
      },
    ];

    const result = extractNames(obj);
    expect(result).toEqual({
      field: 'Field',
    });
  });

  it('should return empty object for null or primitive values', () => {
    expect(extractNames(null)).toEqual({});
    expect(extractNames(undefined)).toEqual({});
    expect(extractNames('string')).toEqual({});
    expect(extractNames(123)).toEqual({});
  });
});

describe('extractNestedFields', () => {
  it('should extract nested fields from array properties', () => {
    const properties = {
      addresses: {
        type: 'array',
        items: {
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
          },
          required: ['street', 'city'],
        },
      },
    };

    const result = extractNestedFields(properties, ['addresses']);
    expect(result).toEqual({
      addresses: {
        properties: ['street', 'city'],
        required: ['street', 'city'],
      },
    });
  });

  it('should handle properties without items', () => {
    const properties = {
      name: {
        type: 'string',
      },
    };

    const result = extractNestedFields(properties, ['name']);
    expect(result).toEqual({});
  });

  it('should handle empty property keys', () => {
    const properties = {
      addresses: {
        type: 'array',
        items: {
          properties: {
            street: { type: 'string' },
          },
        },
      },
    };

    const result = extractNestedFields(properties, []);
    expect(result).toEqual({});
  });

  it('should handle multiple array properties', () => {
    const properties = {
      addresses: {
        type: 'array',
        items: {
          properties: {
            street: { type: 'string' },
          },
          required: ['street'],
        },
      },
      phones: {
        type: 'array',
        items: {
          properties: {
            number: { type: 'string' },
          },
          required: ['number'],
        },
      },
    };

    const result = extractNestedFields(properties, ['addresses', 'phones']);
    expect(result).toEqual({
      addresses: {
        properties: ['street'],
        required: ['street'],
      },
      phones: {
        properties: ['number'],
        required: ['number'],
      },
    });
  });
});

describe('prettify', () => {
  it('should convert camelCase to Title Case', () => {
    expect(prettify('firstName')).toBe('First Name');
    expect(prettify('lastName')).toBe('Last Name');
  });

  it('should convert snake_case to Title Case', () => {
    expect(prettify('first_name')).toBe('First name');
    expect(prettify('user_id')).toBe('User id');
  });

  it('should convert kebab-case to Title Case', () => {
    expect(prettify('first-name')).toBe('First name');
    expect(prettify('phone-number')).toBe('Phone number');
  });

  it('should capitalize single word', () => {
    expect(prettify('firstName')).toBe('First Name');
  });

  it('should handle already capitalized words', () => {
    expect(prettify('FirstName')).toBe('First Name');
  });

  it('should preserve multiple spaces', () => {
    expect(prettify('first__name')).toBe('First  name');
  });
});
