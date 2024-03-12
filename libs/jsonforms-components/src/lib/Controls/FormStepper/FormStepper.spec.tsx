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
const data1 = {
  firstName: '',
  address: {
    street: '',
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

describe('getFormFieldValue', () => {
  it('Should return empty value for a given scope and empty data', () => {
    const scope1 = '#/properties/secondName';
    const scope2 = '#/properties/address/properties/street';
    expect(getFormFieldValue(scope1, data1)).toEqual('');
    expect(getFormFieldValue(scope2, data1)).toEqual('');
  });
});

describe('resolveLabelFromScope function', () => {
  it('returns correctly formatted string for valid scope patterns', () => {
    const validScope1 = '#/properties/firstName';
    const validScope2 = '#/properties/address/properties/city';
    expect(resolveLabelFromScope(validScope1)).toEqual('First name');
    expect(resolveLabelFromScope(validScope2)).toEqual('City');
  });

  it('returns null for scope not starting with "#"', () => {
    const invalidScope = '/properties/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for scope missing "properties"', () => {
    const invalidScope = '#/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for scope with incorrect "properties" spelling', () => {
    const invalidScope = '#/propertees/firstName';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });

  it('returns null for invalid scope patterns', () => {
    const invalidScope1 = '#/properties/';
    const invalidScope2 = '##/properties/firstName';
    const invalidScope3 = '#/properties/first/Name';
    expect(resolveLabelFromScope(invalidScope1)).toBeNull();
    expect(resolveLabelFromScope(invalidScope2)).toBeNull();
    expect(resolveLabelFromScope(invalidScope3)).toBeNull();
  });

  it('returns empty string for empty or null scope', () => {
    const emptyScope = '';
    expect(resolveLabelFromScope(emptyScope)).toBeNull();
  });

  it('returns an empty string if the scope does not end with a valid property name', () => {
    const invalidScope = '#/properties/';
    expect(resolveLabelFromScope(invalidScope)).toBeNull();
  });
});
