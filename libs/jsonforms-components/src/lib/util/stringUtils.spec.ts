import '@testing-library/jest-dom';
import { ControlElement, ControlProps, JsonSchema7 } from '@jsonforms/core';

import {
  capitalizeFirstLetter,
  convertToReadableFormat,
  getLastSegmentFromPointer,
  getRequiredIfThen,
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
    handleChange: (path, value) => {},
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
    handleChange: (path, value) => {},
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
  });
});
