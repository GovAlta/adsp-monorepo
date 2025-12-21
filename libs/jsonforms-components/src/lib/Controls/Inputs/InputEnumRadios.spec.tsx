import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';
import { GoACells, GoARenderers } from '../../../index';
import { UISchemaElement } from '@jsonforms/core';

/**
 * VERY IMPORTANT:  Rendering <JsonForms ... /> does not work unless the following
 * is included.
 */
window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: true,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
});

const ajv = new Ajv({ allErrors: true, verbose: true });

const getForm = (schema: object, uiSchema: UISchemaElement, data: object = {}) => {
  return (
    <JsonForms data={data} schema={schema} uischema={uiSchema} ajv={ajv} renderers={GoARenderers} cells={GoACells} />
  );
};

const uiSchema = {
  type: 'Control',
  scope: '#/properties/options',
  label: 'bob',
  options: { format: 'radio' },
} as UISchemaElement;

const dataSchema = {
  type: 'object',
  properties: {
    options: {
      type: 'string',
      enum: ['one', 'two', 'three'],
    },
  },
};

describe('Input Boolean Radio Control', () => {
  it('will render radio buttons', () => {
    const { baseElement } = render(getForm(dataSchema, uiSchema));
    const radio = baseElement.querySelector("goa-radio-group[testId='options-radio-group']");

    expect(radio).toBeInTheDocument();
  });

  it('will accept a yes click', () => {
    const data = { radio: false };
    const { baseElement } = render(getForm(dataSchema, uiSchema, data));
    const radioGroup = baseElement.querySelector("goa-radio-group[testId='options-radio-group']");
    expect(radioGroup).toBeInTheDocument();
    expect(radioGroup.getAttribute('value')).toBeNull();

    fireEvent(radioGroup, new CustomEvent('_change', { detail: { name: 'bob', value: 'two' } }));
    expect(radioGroup.getAttribute('value')).toBe('two');
  });
});
