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

const dataSchemaWithOneOf = {
  type: 'object',
  properties: {
    options: {
      type: 'array',
      items: {
        type: 'string',
        oneOf: [
          { const: 'one', title: 'Option One', description: 'Select this for the first choice' },
          { const: 'two', title: 'Option Two', description: 'Select this for the second choice' },
          { const: 'three', title: 'Option Three', description: 'Select this for the third choice' },
          { const: 'four', title: 'Option Four', description: 'Select this to enable the text field below' },
        ],
      },
      uniqueItems: true,
    },
    otherSpecify: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
  required: ['options'],
};

const uiSchemaForOneOf = {
  type: 'Group',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/name',
    },
    {
      type: 'Control',
      scope: '#/properties/options',
      label: 'testing',
      options: {
        format: 'checkbox',
        orientation: 'horizontal',
      },
    },
    {
      type: 'Control',
      scope: '#/properties/otherSpecify',
      label: 'If four, specify:',
      rule: {
        effect: 'ENABLE',
        condition: {
          scope: '#/properties/options',
          schema: {
            type: 'array',
            contains: {
              const: 'four',
            },
          },
        },
      },
    },
  ],
} as UISchemaElement;

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
    expect(inputBox?.getAttribute('disabled')).toBeFalsy();
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

    fireEvent(
      option1Checkbox,
      new CustomEvent('_change', {
        detail: { name: 'one', value: 'one', checked: true },
      })
    );

    expect(option1Checkbox.getAttribute('checked')).toBeTruthy();
    expect(option1Checkbox.getAttribute('text')).toBe('one');
  });

  it('calls handleChange and updates selected values when checkboxes are toggled', () => {
    const data = { options: ['one'] };
    const { container } = render(getForm(dataSchema, uiSchema, data));

    const checkboxOne = container.querySelector('goa-checkbox[name="one"]');
    const checkboxTwo = container.querySelector('goa-checkbox[name="two"]');

    expect(checkboxOne).toBeInTheDocument();
    expect(checkboxTwo).toBeInTheDocument();

    fireEvent(checkboxTwo!, new CustomEvent('_change', { detail: { name: 'two', value: true } }));
    fireEvent(checkboxOne!, new CustomEvent('_change', { detail: { name: 'one', value: false } }));
  });

  it('renders checkboxes with descriptions when using oneOf schema', () => {
    const dataSchemaWithDescriptions = {
      type: 'object',
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'string',
            oneOf: [
              { const: 'one', title: 'Option One', description: 'This is the first option' },
              { const: 'two', title: 'Option Two', description: 'This is the second option' },
              { const: 'three', title: 'Option Three', description: 'This is the third option' },
            ],
          },
        },
      },
    };

    const { container } = render(getForm(dataSchemaWithDescriptions, uiSchema));

    const checkboxOne = container.querySelector('goa-checkbox[name="one"]');
    const checkboxTwo = container.querySelector('goa-checkbox[name="two"]');
    const checkboxThree = container.querySelector('goa-checkbox[name="three"]');

    expect(checkboxOne).toBeInTheDocument();
    expect(checkboxTwo).toBeInTheDocument();
    expect(checkboxThree).toBeInTheDocument();

    // Verify titles are used as labels
    expect(checkboxOne?.getAttribute('text')).toBe('Option One');
    expect(checkboxTwo?.getAttribute('text')).toBe('Option Two');
    expect(checkboxThree?.getAttribute('text')).toBe('Option Three');

    // Verify descriptions are present
    expect(checkboxOne?.getAttribute('description')).toBe('This is the first option');
    expect(checkboxTwo?.getAttribute('description')).toBe('This is the second option');
    expect(checkboxThree?.getAttribute('description')).toBe('This is the third option');
  });

  it('renders checkboxes without description when using simple enum', () => {
    const { container } = render(getForm(dataSchema, uiSchema));

    const checkboxOne = container.querySelector('goa-checkbox[name="one"]');
    expect(checkboxOne).toBeInTheDocument();
    expect(checkboxOne?.getAttribute('description')).toBeNull();
  });

  it('handles oneOf at schema level (not items level)', () => {
    const dataSchemaWithOneOf = {
      type: 'object',
      properties: {
        options: {
          type: 'string',
          oneOf: [
            { const: 'opt1', title: 'First', description: 'First choice' },
            { const: 'opt2', title: 'Second', description: 'Second choice' },
          ],
        },
      },
    };

    const { container } = render(getForm(dataSchemaWithOneOf, uiSchema));

    const checkboxOne = container.querySelector('goa-checkbox[name="opt1"]');
    const checkboxTwo = container.querySelector('goa-checkbox[name="opt2"]');

    expect(checkboxOne).toBeInTheDocument();
    expect(checkboxTwo).toBeInTheDocument();

    expect(checkboxOne?.getAttribute('text')).toBe('First');
    expect(checkboxTwo?.getAttribute('text')).toBe('Second');

    expect(checkboxOne?.getAttribute('description')).toBe('First choice');
    expect(checkboxTwo?.getAttribute('description')).toBe('Second choice');
  });

  it('renders checkboxes with descriptions using the full oneOf schema with conditional rule', () => {
    const { container } = render(getForm(dataSchemaWithOneOf, uiSchemaForOneOf));

    // Check all four checkboxes are rendered
    const checkboxOne = container.querySelector('goa-checkbox[name="one"]');
    const checkboxTwo = container.querySelector('goa-checkbox[name="two"]');
    const checkboxThree = container.querySelector('goa-checkbox[name="three"]');
    const checkboxFour = container.querySelector('goa-checkbox[name="four"]');

    expect(checkboxOne).toBeInTheDocument();
    expect(checkboxTwo).toBeInTheDocument();
    expect(checkboxThree).toBeInTheDocument();
    expect(checkboxFour).toBeInTheDocument();

    // Verify titles are used as labels
    expect(checkboxOne?.getAttribute('text')).toBe('Option One');
    expect(checkboxTwo?.getAttribute('text')).toBe('Option Two');
    expect(checkboxThree?.getAttribute('text')).toBe('Option Three');
    expect(checkboxFour?.getAttribute('text')).toBe('Option Four');

    // Verify descriptions are present
    expect(checkboxOne?.getAttribute('description')).toBe('Select this for the first choice');
    expect(checkboxTwo?.getAttribute('description')).toBe('Select this for the second choice');
    expect(checkboxThree?.getAttribute('description')).toBe('Select this for the third choice');
    expect(checkboxFour?.getAttribute('description')).toBe('Select this to enable the text field below');
  });

  it('enables conditional field when "four" checkbox is selected in oneOf schema', () => {
    const data = { options: ['four'] };
    const { container } = render(getForm(dataSchemaWithOneOf, uiSchemaForOneOf, data));

    // The otherSpecify field should be enabled when "four" is selected
    const inputBox = container.querySelector('goa-input');
    expect(inputBox?.getAttribute('disabled')).toBeFalsy();
  });
});
