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
  type: 'Group',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/options',
      label: 'testing',
      options: { format: 'checkbox', orientation: 'horizontal' },
    },
    {
      type: 'Control',
      scope: '#/properties/otherSpecify',
      label: 'If three, specify:',
      rule: {
        effect: 'ENABLE',
        condition: {
          scope: '#/properties/options',
          schema: {
            type: 'array',
            contains: {
              const: 'three',
            },
          },
        },
      },
    },
  ],
} as UISchemaElement;

const dataSchema = {
  type: 'object',
  properties: {
    options: {
      type: 'string',
      enum: ['one', 'two', 'three'],
    },
    otherSpecify: {
      type: 'string',
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
  it('disables input box by default because of condition', () => {
    const renderer = render(getForm(dataSchema, uiSchema));
    const inputBox = renderer.container.querySelector('goa-input');
    expect(inputBox?.getAttribute('disabled')).toBe('true');
    expect(inputBox).toBeDisabled();
  });
  it('enables input box once box is checked because of condition', () => {
    const data = { options: ['three'] };
    const renderer = render(getForm(dataSchema, uiSchema, data));
    const inputBox = renderer.container.querySelector('goa-input');
    expect(inputBox?.getAttribute('disabled')).toBe('false');
  });
  it('applies vertical orientation class', () => {
    const newUiSchema = { ...uiSchema };

    // eslint-disable-next-line
    (uiSchema as any).elements[0].options.orientation = undefined;

    render(getForm(dataSchema, newUiSchema));
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

  it('calls handleChange and updates selected values when checkboxes are toggled', () => {
    const data = { options: ['one'] };
    const { container, getByTestId } = render(getForm(dataSchema, uiSchema, data));

    const checkboxOne = container.querySelector('goa-checkbox[name="one"]');
    const checkboxTwo = container.querySelector('goa-checkbox[name="two"]');

    expect(checkboxOne).toBeInTheDocument();
    expect(checkboxTwo).toBeInTheDocument();

    fireEvent(checkboxTwo!, new CustomEvent('_change', { detail: { name: 'two', value: true } }));
    fireEvent(checkboxOne!, new CustomEvent('_change', { detail: { name: 'one', value: false } }));
  });
});
