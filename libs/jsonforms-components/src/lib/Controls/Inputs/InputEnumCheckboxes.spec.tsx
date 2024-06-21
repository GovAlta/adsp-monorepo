import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';
import { GoACells, GoARenderers } from '../../../index';
import { UISchemaElement } from '@jsonforms/core';

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
    handleChange: jest.fn(),
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
  label: 'testing',
  options: { format: 'checkbox' },
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

describe('Input Boolean Checkbox Control', () => {
  it('will render checkboxes', () => {
    render(getForm(dataSchema, uiSchema));
    const checkboxes = screen.getByTestId('testing-jsonforms-checkboxes');
    expect(checkboxes).toBeInTheDocument();
  });
  it('renders all checkboxes with correct labels', () => {
    const data = { checkboxes: ['one', 'two', 'three'] };
    const renderer = render(getForm(dataSchema, uiSchema, data));
    const checkboxGroup = renderer.getByTestId('testing-jsonforms-checkboxes');
    expect(checkboxGroup).toBeInTheDocument();
    expect(checkboxGroup.children[0].getAttribute('text')).toBe(data.checkboxes[0]);
    expect(checkboxGroup.children[1].getAttribute('text')).toBe(data.checkboxes[1]);
    expect(checkboxGroup.children[2].getAttribute('text')).toBe(data.checkboxes[2]);
  });
  it('applies vertical orientation class', () => {
    render(getForm(dataSchema, uiSchema));
    const checkboxGroupDiv = screen.getByTestId('testing-jsonforms-checkboxes');
    expect(checkboxGroupDiv).toHaveClass('vertical');
  });
  it('calls handleChange with the correct values when a checkbox is clicked', () => {
    const data = {};
    const renderer = render(getForm(dataSchema, uiSchema, data));
    const checkboxGroup = renderer.getByTestId('testing-jsonforms-checkboxes');
    const option1Checkbox = checkboxGroup.children[0];
    fireEvent.click(option1Checkbox);
    expect(option1Checkbox.getAttribute('checked')).toBeTruthy();
    expect(option1Checkbox.getAttribute('text')).toBe('one');
  });
});
