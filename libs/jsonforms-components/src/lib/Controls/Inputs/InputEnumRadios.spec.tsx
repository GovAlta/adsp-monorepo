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
    const radio = baseElement.querySelector("goa-radio-group[testId='bob-jsonforms-radio']");

    expect(radio).toBeInTheDocument();
  });

  it('will render all enum options as radio items', () => {
    const { baseElement } = render(getForm(dataSchema, uiSchema));
    const radioItems = baseElement.querySelectorAll('goa-radio-item');

    expect(radioItems).toHaveLength(3);
    expect(radioItems[0].getAttribute('value')).toBe('one');
    expect(radioItems[1].getAttribute('value')).toBe('two');
    expect(radioItems[2].getAttribute('value')).toBe('three');
  });

  it('will accept a yes click', () => {
    const data = { radio: false };
    const { baseElement } = render(getForm(dataSchema, uiSchema, data));
    const radioGroup = baseElement.querySelector("goa-radio-group[testId='bob-jsonforms-radio']");
    expect(radioGroup).toBeInTheDocument();
    expect(radioGroup.getAttribute('value')).toBeNull();

    fireEvent(radioGroup, new CustomEvent('_change', { detail: { name: 'bob', value: 'two' } }));
    expect(radioGroup.getAttribute('value')).toBe('two');
  });

  it('will render with initial data value', () => {
    const data = { options: 'two' };
    const { baseElement } = render(getForm(dataSchema, uiSchema, data));
    const radioGroup = baseElement.querySelector("goa-radio-group[testId='bob-jsonforms-radio']");

    expect(radioGroup.getAttribute('value')).toBe('two');
  });

  it('will render as disabled when enabled is false', () => {
    const disabledUiSchema = {
      ...uiSchema,
      options: { ...uiSchema.options, disabled: true },
    };
    const { baseElement } = render(getForm(dataSchema, disabledUiSchema));
    const radioGroup = baseElement.querySelector("goa-radio-group[testId='bob-jsonforms-radio']");

    expect(radioGroup.getAttribute('disabled')).toBe('true');
  });

  it('will show error when visited and has validation errors', () => {
    const requiredSchema = {
      type: 'object',
      properties: {
        options: {
          type: 'string',
          enum: ['one', 'two', 'three'],
        },
      },
      required: ['options'],
    };

    const { baseElement } = render(getForm(requiredSchema, uiSchema, {}));
    const radioGroup = baseElement.querySelector("goa-radio-group[testId='bob-jsonforms-radio']");

    fireEvent(radioGroup, new CustomEvent('_change', { detail: { name: 'bob', value: '' } }));

    expect(radioGroup.getAttribute('error')).toBeTruthy();
  });

  it('will apply componentProps from uischema', () => {
    const uiSchemaWithProps = {
      ...uiSchema,
      options: {
        ...uiSchema.options,
        componentProps: {
          orientation: 'horizontal',
        },
      },
    };
    const { baseElement } = render(getForm(dataSchema, uiSchemaWithProps));
    const radioGroup = baseElement.querySelector("goa-radio-group[testId='bob-jsonforms-radio']");

    expect(radioGroup.getAttribute('orientation')).toBe('horizontal');
  });

  it('will use label from options when no label is provided', () => {
    const uiSchemaNoLabel = {
      type: 'Control',
      scope: '#/properties/options',
      options: { format: 'radio', label: 'Custom Label' },
    } as UISchemaElement;

    const { baseElement } = render(getForm(dataSchema, uiSchemaNoLabel));
    const radioGroup = baseElement.querySelector('goa-radio-group');

    expect(radioGroup).toBeInTheDocument();
    const radioItems = baseElement.querySelectorAll('goa-radio-item');
    expect(radioItems.length).toBeGreaterThan(0);
  });

  it('will handle schema without enum property', () => {
    const noEnumSchema = {
      type: 'object',
      properties: {
        options: {
          type: 'string',
        },
      },
    };

    const { baseElement } = render(getForm(noEnumSchema, uiSchema));
    const radioItems = baseElement.querySelectorAll('goa-radio-item');

    expect(radioItems).toHaveLength(0);
  });

  it('will handle numeric enum values', () => {
    const numericEnumSchema = {
      type: 'object',
      properties: {
        options: {
          type: 'number',
          enum: [1, 2, 3],
        },
      },
    };

    const { baseElement } = render(getForm(numericEnumSchema, uiSchema));
    const radioItems = baseElement.querySelectorAll('goa-radio-item');

    expect(radioItems).toHaveLength(3);
    expect(radioItems[0].getAttribute('value')).toBe('1');
    expect(radioItems[1].getAttribute('value')).toBe('2');
    expect(radioItems[2].getAttribute('value')).toBe('3');
  });

  it('will merge config and uischema options correctly', () => {
    const uiSchemaWithMultipleOptions = {
      ...uiSchema,
      options: {
        format: 'radio',
        orientation: 'horizontal',
      },
    };

    const { baseElement } = render(getForm(dataSchema, uiSchemaWithMultipleOptions));
    const radioGroup = baseElement.querySelector('goa-radio-group');

    expect(radioGroup.getAttribute('orientation')).toBe('horizontal');
  });
});
