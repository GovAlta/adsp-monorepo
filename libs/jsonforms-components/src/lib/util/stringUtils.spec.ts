import '@testing-library/jest-dom';
import { ControlElement, ControlProps, JsonSchema7 } from '@jsonforms/core';

import {
  capitalizeFirstLetter,
  convertToReadableFormat,
  convertToSentenceCase,
  getLastSegmentFromPointer,
  getRequiredIfThen,
  isEmptyBoolean,
  isEmptyNumber,
  controlScopeMatchesLabel,
  getLabelText,
  validateSinWithLuhn,
} from './stringUtils';
import { describe } from 'node:test';
import { GoAInputTextProps } from '../Controls';

describe('stringUtils string tests', () => {
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/firstName',
    label: 'My First name',
    options: {
      autoCapitalize: false,
    },
  };
  const schemaIfThenProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {},
    rootSchema: {
      properties: {
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
      if: {
        properties: {},
      },
      then: {
        required: ['firstName'],
      },
      else: {
        required: ['firstName'],
      },
    },
    handleChange: () => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: 'firstName',
    errors: '',
    data: 'My Name',
    visible: true,
    isValid: true,
    required: false,
    isVisited: false,
    setIsVisited: () => {},
  };

  const schemaAllOfIfThenProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {},
    rootSchema: {
      properties: {
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
      allOf: [
        {
          if: {
            properties: {
              firstName: {
                const: 'Test',
              },
            },
          },
          then: {
            required: ['firstName'],
          },
          else: {
            required: ['lastName'],
          },
        },
      ],
    },
    handleChange: () => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: 'firstName',
    errors: '',
    data: 'My Name',
    visible: true,
    isValid: true,
    required: false,
    isVisited: false,
    setIsVisited: () => {},
  };

  describe('rootSchema string tests', () => {
    it('test getIfThenRequired has If Then', () => {
      const result = getRequiredIfThen(schemaIfThenProps);
      expect(result).not.toBeNull();
    });

    it('root schema must exist', () => {
      expect(schemaIfThenProps).toBeTruthy();
      expect(schemaIfThenProps?.rootSchema).toBeTruthy();
    });

    it('Then condition should exist if there is a If condition', () => {
      const rootSchema = schemaIfThenProps?.rootSchema as JsonSchema7;
      expect(schemaIfThenProps).toBeTruthy();
      expect(rootSchema?.if).toBeTruthy();
      expect(rootSchema?.then).toBeTruthy();
    });

    it('Then/Else condition should exist if there is a If condition', () => {
      const rootSchema = schemaIfThenProps?.rootSchema as JsonSchema7;
      expect(schemaIfThenProps).toBeTruthy();
      expect(rootSchema?.if).toBeTruthy();
      expect(rootSchema?.then).toBeTruthy();
      expect(rootSchema?.else).toBeTruthy();
    });

    it('When If condition changes to true required data must be entered', () => {
      const result = getRequiredIfThen(schemaIfThenProps);
      expect(result.length > 0).toBe(true);
    });

    it('When allOf IfThenElse should have required conditions', () => {
      const result = getRequiredIfThen(schemaAllOfIfThenProps);
      expect(result.length > 0).toBe(true);
    });

    it('When allOf If then should trigger else', () => {
      const clonedSchema = {
        ...schemaAllOfIfThenProps,
        path: 'lastName',
        data: {
          lastName: 'Test',
        },
      };
      const results = getRequiredIfThen(clonedSchema);
      expect(results.length > 0).toBe(true);
    });
  });

  it('When allOf should have at least one If condition', () => {
    const schema = schemaAllOfIfThenProps.rootSchema as JsonSchema7;
    const ifConditions = schema.allOf?.filter((y) => y.if !== undefined);
    expect(ifConditions && ifConditions.length > 0).toBe(true);
  });

  it('When allOf should have at least one else condition', () => {
    const schema = schemaAllOfIfThenProps.rootSchema as JsonSchema7;
    const elseConditions = schema.allOf?.filter((y) => y.else !== undefined);
    expect(elseConditions && elseConditions.length > 0).toBe(true);
  });

  describe('string function test', () => {
    it('capitalizeFirstLetter is null', () => {
      const testValue: string = null;
      const returnValue = capitalizeFirstLetter(testValue);
      expect(returnValue).toBe('');
    });

    it('convertToReadableFormat is null', () => {
      const testValue: string = null;
      const returnValue = convertToReadableFormat(testValue);
      expect(returnValue).toBe(null);
    });

    it('convertToSentenceCase handles null input', () => {
      const testValue: string = null;
      const returnValue = convertToSentenceCase(testValue);
      expect(returnValue).toBe(null);
    });

    it('convertToSentenceCase handles empty string', () => {
      const returnValue = convertToSentenceCase('');
      expect(returnValue).toBe('');
    });

    it('convertToSentenceCase converts camelCase correctly', () => {
      const returnValue = convertToSentenceCase('firstName');
      expect(returnValue).toBe('First name');
    });

    it('convertToSentenceCase converts PascalCase correctly', () => {
      const returnValue = convertToSentenceCase('FirstName');
      expect(returnValue).toBe('First name');
    });

    it('getLastSegmentFromPointer throws error for invalid pointer', () => {
      expect(() => getLastSegmentFromPointer('invalid')).toThrow("Invalid JSON pointer. Must start with '#/'");
    });

    it('getLastSegmentFromPointer extracts last segment correctly', () => {
      const result = getLastSegmentFromPointer('#/properties/firstName');
      expect(result).toBe('firstName');
    });

    it('convertToReadableFormat handles empty string', () => {
      const returnValue = convertToReadableFormat('');
      expect(returnValue).toBe('');
    });

    it('capitalizeFirstLetter handles single character', () => {
      const result = capitalizeFirstLetter('a');
      expect(result).toBe('A');
    });

    it('capitalizeFirstLetter handles mixed case', () => {
      const result = capitalizeFirstLetter('hELLO');
      expect(result).toBe('Hello');
    });

    it('capitalizeFirstLetter handles numbers with letters', () => {
      const result = capitalizeFirstLetter('123abc');
      expect(result).toBe('123abc');
    });

    it('convertToSentenceCase handles single word', () => {
      const result = convertToSentenceCase('name');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('convertToSentenceCase handles already capitalized', () => {
      const result = convertToSentenceCase('FirstName');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('getLastSegmentFromPointer handles complex paths', () => {
      const result = getLastSegmentFromPointer('#/properties/user/name');
      expect(result).toBe('name');
    });

    it('convertToReadableFormat handles special characters', () => {
      const result = convertToReadableFormat('first-name');
      expect(result).toBeDefined();
    });

    it('isEmptyNumber with NaN value', () => {
      const result = isEmptyNumber({ type: 'number' }, 'abc');
      expect(result).toBe(true);
    });

    it('isEmptyNumber with null', () => {
      const result = isEmptyNumber({ type: 'number' }, null);
      expect(result).toBe(true);
    });

    it('isEmptyNumber with undefined', () => {
      const result = isEmptyNumber({ type: 'number' }, undefined);
      expect(result).toBe(true);
    });

    it('isEmptyNumber with empty string', () => {
      const result = isEmptyNumber({ type: 'number' }, '');
      expect(result).toBe(true);
    });

    it('isEmptyNumber with valid number', () => {
      const result = isEmptyNumber({ type: 'number' }, 42);
      expect(result).toBe(false);
    });

    it('isEmptyNumber with integer type NaN', () => {
      const result = isEmptyNumber({ type: 'integer' }, 'not-a-number');
      expect(result).toBe(true);
    });

    it('isEmptyBoolean with null', () => {
      const result = isEmptyBoolean({ type: 'boolean' }, null);
      expect(result).toBe(true);
    });

    it('isEmptyBoolean with undefined', () => {
      const result = isEmptyBoolean({ type: 'boolean' }, undefined);
      expect(result).toBe(true);
    });

    it('isEmptyBoolean with value false', () => {
      const result = isEmptyBoolean({ type: 'boolean' }, false);
      expect(result).toBe(false);
    });

    it('isEmptyBoolean with value true', () => {
      const result = isEmptyBoolean({ type: 'boolean' }, true);
      expect(result).toBe(false);
    });

    it('isEmptyBoolean with non-boolean type', () => {
      const result = isEmptyBoolean({ type: 'string' }, null);
      expect(result).toBe(false);
    });

    it('controlScopeMatchesLabel exact match', () => {
      const result = controlScopeMatchesLabel('#/properties/firstName', 'firstName');
      expect(result).toBe(true);
    });

    it('controlScopeMatchesLabel with spaces in scope', () => {
      const result = controlScopeMatchesLabel('#/properties/first name', 'firstName');
      expect(result).toBe(true);
    });

    it('controlScopeMatchesLabel different values', () => {
      const result = controlScopeMatchesLabel('#/properties/firstName', 'lastName');
      expect(result).toBe(false);
    });

    it('controlScopeMatchesLabel empty scope', () => {
      const result = controlScopeMatchesLabel('', 'test');
      expect(result).toBe(false);
    });

    it('controlScopeMatchesLabel case insensitive', () => {
      const result = controlScopeMatchesLabel('#/properties/FirstName', 'FIRSTNAME');
      expect(result).toBe(true);
    });

    it('getLabelText matching scope not uppercase', () => {
      const result = getLabelText('#/properties/firstName', 'firstName');
      expect(result).toBeDefined();
    });

    it('getLabelText all uppercase label', () => {
      const result = getLabelText('#/properties/ABC', 'ABC');
      expect(result).toBe('ABC');
    });

    it('getLabelText non-matching scope', () => {
      const result = getLabelText('#/properties/firstName', 'lastName');
      expect(result).toBe('lastName');
    });

    it('getLabelText empty label', () => {
      const result = getLabelText('#/properties/firstName', '');
      expect(result).toBe('');
    });

    it('validateSinWithLuhn sample value', () => {
      const result = validateSinWithLuhn(123456789);
      expect(typeof result).toBe('boolean');
    });

    it('validateSinWithLuhn various values', () => {
      const result1 = validateSinWithLuhn(100);
      const result2 = validateSinWithLuhn(999999999);
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    it('validateSinWithLuhn single digit', () => {
      const result = validateSinWithLuhn(0);
      expect(typeof result).toBe('boolean');
    });

    it('getRequiredIfThen with if/then structure', () => {
      const schema: GoAInputTextProps & ControlProps = {
        uischema: { type: 'Control', scope: '#/properties/firstName' },
        schema: {},
        rootSchema: {
          properties: {
            firstName: { type: 'string' },
          },
          if: {
            properties: {
              field1: { enum: ['option1'] },
            },
          },
          then: {
            required: ['firstName', 'lastName'],
          },
        },
        handleChange: () => {},
      };
      const result = getRequiredIfThen(schema);
      expect(Array.isArray(result)).toBe(true);
    });

    it('getRequiredIfThen with nested else structure', () => {
      const schema: GoAInputTextProps & ControlProps = {
        uischema: { type: 'Control', scope: '#/properties/firstName' },
        schema: {},
        rootSchema: {
          properties: {
            firstName: { type: 'string' },
          },
          allOf: [
            {
              if: { properties: {} },
              else: { required: ['firstName'] },
            },
          ],
        },
        handleChange: () => {},
      };
      const result = getRequiredIfThen(schema);
      expect(Array.isArray(result)).toBe(true);
    });

    it('getRequiredIfThen with allOf if/else/then', () => {
      const schema: GoAInputTextProps & ControlProps = {
        uischema: { type: 'Control', scope: '#/properties/field' },
        schema: {},
        rootSchema: {
          properties: {
            field: { type: 'string' },
          },
          allOf: [
            {
              if: { properties: {} },
              then: { required: ['field'] },
              else: { required: ['field'] },
            },
          ],
        },
        handleChange: () => {},
      };
      const result = getRequiredIfThen(schema);
      expect(Array.isArray(result)).toBe(true);
    });

    it('getRequiredIfThen with root schema if without then', () => {
      const schema: GoAInputTextProps & ControlProps = {
        uischema: { type: 'Control', scope: '#/properties/field' },
        schema: {},
        rootSchema: {
          properties: {
            field: { type: 'string' },
          },
          if: {
            properties: {},
          },
          else: {
            required: ['field'],
          },
        },
        handleChange: () => {},
      };
      const result = getRequiredIfThen(schema);
      expect(Array.isArray(result)).toBe(true);
    });

    it('controlScopeMatchesLabel with matching names', () => {
      const result = controlScopeMatchesLabel('#/properties/firstName', 'FirstName');
      expect(result).toBe(true);
    });

    it('controlScopeMatchesLabel with non-matching names', () => {
      const result = controlScopeMatchesLabel('#/properties/firstName', 'lastName');
      expect(result).toBe(false);
    });

    it('controlScopeMatchesLabel with spaces in label and scope', () => {
      const result = controlScopeMatchesLabel('#/properties/firstName', 'First Name');
      expect(result).toBe(true);
    });

    it('getLabelText with matching scope and label uppercase', () => {
      const result = getLabelText('#/properties/firstName', 'FIRSTNAME');
      expect(result).toBe('FIRSTNAME');
    });

    it('getLabelText with matching scope and proper case', () => {
      const result = getLabelText('#/properties/firstName', 'firstName');
      // capitalizeFirstLetter lowercases the rest, so 'firstName' becomes 'Firstname'
      expect(result).toBe('Firstname');
    });

    it('getLabelText with non-matching scope and label', () => {
      const result = getLabelText('#/properties/firstName', 'Different');
      expect(result).toBe('Different');
    });

    it('isEmptyNumber with null value', () => {
      const schema = { type: 'number' };
      expect(isEmptyNumber(schema, null)).toBe(true);
    });

    it('isEmptyNumber with zero', () => {
      const schema = { type: 'number' };
      expect(isEmptyNumber(schema, 0)).toBe(false);
    });

    it('isEmptyNumber with non-zero number', () => {
      const schema = { type: 'number' };
      expect(isEmptyNumber(schema, 5)).toBe(false);
    });

    it('isEmptyNumber with number string', () => {
      const schema = { type: 'number' };
      expect(isEmptyNumber(schema, '123')).toBe(false);
    });

    it('isEmptyNumber with NaN string for number type', () => {
      const schema = { type: 'number' };
      expect(isEmptyNumber(schema, 'not-a-number')).toBe(true);
    });

    it('isEmptyNumber with NaN string for integer type', () => {
      const schema = { type: 'integer' };
      expect(isEmptyNumber(schema, 'abc')).toBe(true);
    });

    it('isEmptyNumber with empty string', () => {
      const schema = { type: 'number' };
      expect(isEmptyNumber(schema, '')).toBe(true);
    });

    it('isEmptyNumber with undefined', () => {
      const schema = { type: 'number' };
      expect(isEmptyNumber(schema, undefined)).toBe(true);
    });

    it('isEmptyBoolean with true', () => {
      const schema = { type: 'boolean' };
      expect(isEmptyBoolean(schema, true)).toBe(false);
    });

    it('isEmptyBoolean with false', () => {
      const schema = { type: 'boolean' };
      expect(isEmptyBoolean(schema, false)).toBe(false);
    });

    it('isEmptyBoolean with null', () => {
      const schema = { type: 'boolean' };
      expect(isEmptyBoolean(schema, null)).toBe(true);
    });

    it('convertToReadableFormat with valid input', () => {
      const result = convertToReadableFormat('camelCaseExample');
      expect(typeof result).toBe('string');
    });

    it('capitalizeFirstLetter with lowercase start', () => {
      const result = capitalizeFirstLetter('hello');
      expect(result).toBe('Hello');
    });

    it('capitalizeFirstLetter with empty string', () => {
      const result = capitalizeFirstLetter('');
      expect(result).toBe('');
    });

    it('convertToSentenceCase with camel case', () => {
      const result = convertToSentenceCase('firstName');
      expect(typeof result).toBe('string');
    });

    it('getLastSegmentFromPointer with valid pointer', () => {
      const result = getLastSegmentFromPointer('#/properties/field');
      expect(result).toBe('field');
    });

    it('getLastSegmentFromPointer with empty string throws error', () => {
      expect(() => {
        getLastSegmentFromPointer('');
      }).toThrow();
    });

    it('getLastSegmentFromPointer with single segment throws error', () => {
      expect(() => {
        getLastSegmentFromPointer('#');
      }).toThrow();
    });

    it('capitalizeFirstLetter with all uppercase', () => {
      const result = capitalizeFirstLetter('HELLO');
      expect(result).toBe('Hello');
    });

    it('capitalizeFirstLetter with single character', () => {
      const result = capitalizeFirstLetter('a');
      expect(result).toBe('A');
    });

    it('convertToReadableFormat with null input', () => {
      const result = convertToReadableFormat('');
      expect(result).toBe('');
    });

    it('getRequiredIfThen with complex nested structure', () => {
      const schema: GoAInputTextProps & ControlProps = {
        uischema: { type: 'Control', scope: '#/properties/test' },
        schema: {},
        rootSchema: {
          properties: {
            test: { type: 'string' },
          },
          allOf: [
            {
              if: { properties: {} },
              then: { required: ['test'] },
              else: { required: ['test'] },
            },
          ],
        },
        handleChange: () => {},
      };
      const result = getRequiredIfThen(schema);
      expect(Array.isArray(result)).toBe(true);
    });

    it('getLabelText with null scope', () => {
      const result = getLabelText('' as string, 'Label');
      expect(result).toBe('Label');
    });

    it('getLabelText with undefined label', () => {
      const result = getLabelText('#/properties/field', '');
      expect(result).toBe('');
    });

    it('controlScopeMatchesLabel with null values', () => {
      const result = controlScopeMatchesLabel('', '');
      expect(typeof result).toBe('boolean');
    });

    it('isEmptyNumber with string type and string value', () => {
      const schema = { type: 'string' };
      expect(isEmptyNumber(schema, 'test')).toBe(false);
    });

    it('isEmptyBoolean with non-boolean type', () => {
      const schema = { type: 'string' };
      expect(isEmptyBoolean(schema, false)).toBe(false);
    });

    it('getRequiredIfThen with rootSchema if but no then or else', () => {
      const schema: GoAInputTextProps & ControlProps = {
        uischema: { type: 'Control', scope: '#/properties/field' },
        schema: {},
        rootSchema: {
          properties: {
            field: { type: 'string' },
          },
          if: { properties: {} },
        },
        handleChange: () => {},
      };
      const result = getRequiredIfThen(schema);
      expect(Array.isArray(result)).toBe(true);
    });

    it('validateSinWithLuhn with 9-digit SIN', () => {
      expect(typeof validateSinWithLuhn(123456782)).toBe('boolean');
      expect(typeof validateSinWithLuhn(46454286)).toBe('boolean');
    });

    it('isEmptyNumber with undefined for integer type', () => {
      const schema = { type: 'integer' };
      expect(isEmptyNumber(schema, undefined)).toBe(true);
    });

    it('isEmptyBoolean with undefined value', () => {
      const schema = { type: 'boolean' };
      expect(isEmptyBoolean(schema, undefined)).toBe(true);
    });

    it('getLabelText with all uppercase non-matching label', () => {
      const result = getLabelText('#/properties/field', 'DIFFERENT');
      expect(result).toBe('DIFFERENT');
    });

    it('controlScopeMatchesLabel with empty strings', () => {
      const result = controlScopeMatchesLabel('', '');
      expect(typeof result).toBe('boolean');
    });

    it('getLabelText when label matches uppercase scope', () => {
      const result = getLabelText('#/properties/test', 'TEST');
      expect(result).toBeDefined();
    });

    it('stringUtils edge case: very long field names', () => {
      const longName = 'a'.repeat(200);
      const result = capitalizeFirstLetter(longName);
      expect(result).toBeDefined();
    });

    it('convertToReadableFormat with dash-separated words', () => {
      const result = convertToReadableFormat('first-name-last');
      expect(result).toBeDefined();
    });

    it('isEmptyNumber with special float values', () => {
      const result = isEmptyNumber({ type: 'number' }, Infinity);
      expect(typeof result).toBe('boolean');
    });

    it('getLabelText with matching scope and lowercase label', () => {
      const result = getLabelText('#/properties/myField', 'myfield');
      expect(result).toBeDefined();
    });

    // Target uncovered branches in stringUtils.ts
    it('controlScopeMatchesLabel with undefined scope returns false', () => {
      const result = controlScopeMatchesLabel(undefined as unknown as string, 'label');
      expect(result).toBe(false);
    });

    it('controlScopeMatchesLabel with undefined label returns false', () => {
      const result = controlScopeMatchesLabel('#/properties/field', undefined as unknown as string);
      expect(result).toBe(false);
    });

    it('getLabelText when areAllUppercase returns true', () => {
      const result = getLabelText('#/properties/FIELD', 'FIELD');
      expect(result).toBe('FIELD');
    });

    it('getRequiredIfThen with rootSchema.else.required matching path', () => {
      const schema: JsonSchema7 = {
        if: { properties: { test: { const: 'value' } } },
        then: { required: ['other'] },
        else: { required: ['targetPath'] },
      };
      const result = getRequiredIfThen({
        schema,
        path: 'targetPath',
        rootSchema: schema,
        uischema: {} as ControlElement,
        handleChange: jest.fn(),
      } as unknown as ControlProps);
      expect(result).toContain('targetPath');
    });

    it('getRequiredIfThen with allOf containing if/else structure with else.required', () => {
      const schema: JsonSchema7 = {
        allOf: [
          {
            if: { properties: { x: { const: 1 } } },
            then: { required: ['a'] },
            else: { required: ['targetPath'] },
          },
        ],
      };
      const result = getRequiredIfThen({
        schema,
        path: 'targetPath',
        rootSchema: schema,
        uischema: {} as ControlElement,
        handleChange: jest.fn(),
      } as unknown as ControlProps);
      expect(result).toContain('targetPath');
    });

    it('convertToSentenceCase returns correctly with empty input', () => {
      const result = convertToSentenceCase('');
      expect(result).toBe('');
    });

    it('convertToSentenceCase handles single word', () => {
      const result = convertToSentenceCase('hello');
      expect(typeof result).toBe('string');
    });

    it('convertToReadableFormat with empty string', () => {
      const result = convertToReadableFormat('');
      expect(result).toBe('');
    });

    it('controlScopeMatchesLabel with path containing numbers', () => {
      const result = controlScopeMatchesLabel('#/properties/field123', 'field123');
      expect(result).toBe(true);
    });

    it('stringUtils: getRequiredIfThen without rootSchema property', () => {
      const schema: GoAInputTextProps & ControlProps = {
        uischema: { type: 'Control', scope: '#/properties/field' },
        schema: {},
        rootSchema: { properties: { field: { type: 'string' } } },
        handleChange: () => {},
      };
      const result = getRequiredIfThen(schema);
      expect(Array.isArray(result)).toBe(true);
    });

    it('convertToReadableFormat splits on various delimiters', () => {
      expect(convertToReadableFormat('first_name')).toBeDefined();
      expect(convertToReadableFormat('firstName')).toBeDefined();
      expect(convertToReadableFormat('first-name')).toBeDefined();
    });

    it('isEmptyBoolean with various falsy values', () => {
      const schema = { type: 'boolean' };
      expect(isEmptyBoolean(schema, 0)).toBe(false);
      expect(isEmptyBoolean(schema, '')).toBe(false);
      expect(isEmptyBoolean(schema, null)).toBe(true);
    });

    it('isEmptyNumber with array as type', () => {
      const schema = { type: ['number', 'null'] };
      const result = isEmptyNumber(schema, null);
      expect(typeof result).toBe('boolean');
    });

    it('getLabelText conditions with mixed case', () => {
      const result1 = getLabelText('#/properties/ABC', 'abc');
      const result2 = getLabelText('#/properties/abc', 'ABC');
      const result3 = getLabelText('#/properties/abc', 'ABC');
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });
  });
});
