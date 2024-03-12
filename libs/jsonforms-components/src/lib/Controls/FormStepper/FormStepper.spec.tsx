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
    expect(resolveLabelFromScope(scope1)).toEqual('First Name');
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
