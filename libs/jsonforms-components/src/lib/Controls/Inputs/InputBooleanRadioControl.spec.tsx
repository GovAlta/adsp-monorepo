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

const getForm = (schema: object, uiSchema: UISchemaElement, data: object = {}) => {
  return (
    <JsonForms
      data={data}
      schema={schema}
      uischema={uiSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );
};

const uiSchema = {
  type: 'Control',
  scope: '#/properties/radio',
  label: 'bob',
  options: { radio: true },
} as UISchemaElement;

const dataSchema = {
  type: 'object',
  properties: {
    radio: {
      type: 'boolean',
    },
  },
};

describe('Input Boolean Radio Control', () => {
  it('will render radio buttons', () => {
    const renderer = render(getForm(dataSchema, uiSchema));
    const radio = renderer.getByTestId('radio-boolean-radio-jsonform');
    expect(radio).toBeInTheDocument();
  });

  it('will accept a yes click', () => {
    const data = { radio: false };
    const renderer = render(getForm(dataSchema, uiSchema, data));
    const radioGroup = renderer.getByTestId('radio-boolean-radio-jsonform');
    expect(radioGroup).toBeInTheDocument();

    fireEvent(radioGroup, new CustomEvent('_change', { detail: { name: 'bob', value: 'Yes' } }));
    expect(radioGroup.getAttribute('value')).toBe('Yes');
  });

  it('will accept a no click', () => {
    const data = { radio: true };
    const renderer = render(getForm(dataSchema, uiSchema, data));
    const radioGroup = renderer.getByTestId('radio-boolean-radio-jsonform');
    expect(radioGroup).toBeInTheDocument();

    fireEvent(radioGroup, new CustomEvent('_change', { detail: { name: 'bob', value: 'No' } }));
    expect(radioGroup.getAttribute('value')).toBe('No');
  });
});
