import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';
import FormStepper, { getFormFieldValue, renderFormFields, resolveLabelFromScope } from './FormStepperControl';
import {
  Categorization,
  UISchemaElement,
  deriveLabelForUISchemaElement,
  Category,
  StatePropsOfLayout,
  isVisible,
  isEnabled,
} from '@jsonforms/core';
import Ajv from 'ajv';
import { AjvProps, withAjvProps } from '@jsonforms/material-renderers';
import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps, useJsonForms } from '@jsonforms/react';
import { mock } from 'node:test';
export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  // eslint-disable-next-line
  data: any;
}

//mock data
const data = {
  firstName: 'Alex',
  address: {
    street: 'Springfield',
  },
};

const translator = {
  id: '',
  defaultMessage: '',
  values: '',
};

describe('resolveLabelFromScope', () => {
  it('Should correctly resolve and format label from scope', () => {
    const scope1 = '#/properties/firstName';
    const scope2 = '#/properties/address/properties/street';
    expect(resolveLabelFromScope(scope1)).toEqual('First name');
    expect(resolveLabelFromScope(scope2)).toEqual('Street');
  });
});
describe('getFormFieldValue', () => {
  it('Should return the correct value for a given scope', () => {
    const scope1 = '#/properties/firstName';
    const scope2 = '#/properties/address/properties/street';
    expect(getFormFieldValue(scope1, data)).toEqual('Alex');
    expect(getFormFieldValue(scope2, data)).toEqual('Springfield');
  });
});
describe('Scope Value Validation', () => {
  it('should start with "#/"', () => {
    const scopes = [
      '#/properties/firstName',
      '#/properties/address/properties/city',
      '#/properties/nested/properties/deep/properties/more',
    ];

    scopes.forEach((scope) => {
      expect(scope.startsWith('#/')).toBeTruthy();
    });
  });

  it('should contain the word "properties" spelled correctly', () => {
    const scopes = [
      '#/properties/firstName',
      '#/properties/address/properties/city',
      '#/properties/nested/properties/deep/properties/more',
    ];

    const propertiesRegex = /properties/;
    scopes.forEach((scope) => {
      expect(propertiesRegex.test(scope)).toBeTruthy();
    });
  });

  it('should correctly structure nested properties', () => {
    const scopes = [
      '#/properties/firstName',
      '#/properties/address/properties/city',
      '#/properties/nested/properties/deep/properties/more',
      'properties/firstName',
      '/properties/firstName/',
      '#/propertiez/firstName',
    ];

    // eslint-disable-next-line no-useless-escape
    const validPatternRegex = /^#(\/properties\/[^\/]+)+$/;

    scopes.forEach((scope) => {
      const isValid = validPatternRegex.test(scope);
      if (scope.includes('propertiez') || scope.endsWith('/') || !scope.startsWith('#/')) {
        expect(isValid).toBeFalsy();
      } else {
        expect(isValid).toBeTruthy();
      }
    });
  });
});
