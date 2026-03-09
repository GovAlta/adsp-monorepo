import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';
import { GoACells, GoARenderers } from '../../../index';
import { UISchemaElement } from '@jsonforms/core';
import { GoARadioGroupControlTester, RadioGroup } from './InputEnumRadios';

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

  it('uses id fallback in testId when path is empty and can be disabled', () => {
    const handleChange = jest.fn();
    const { baseElement } = render(
      <RadioGroup
        data={undefined}
        id="enum-id"
        enabled={false}
        schema={{ enum: ['one', 'two'] }}
        uischema={{ type: 'Control' }}
        path=""
        handleChange={handleChange}
        options={{}}
        config={{}}
        label="Options"
        isVisited={true}
        errors={'error'}
      />
    );

    const radioGroup = baseElement.querySelector("goa-radio-group[testId='enum-id-radio-group']");
    expect(radioGroup).toBeInTheDocument();
    expect(radioGroup?.getAttribute('disabled')).toBe('true');
  });

  it('uses label fallback in name and testId when path and id are empty', () => {
    const label = 'Option Label';
    const { baseElement } = render(
      <RadioGroup
        data={undefined}
        id=""
        enabled={true}
        schema={{ enum: ['one'] }}
        uischema={{ type: 'Control' }}
        path=""
        handleChange={jest.fn()}
        options={{ label }}
        config={{}}
        label={label}
        isVisited={false}
        errors={''}
      />
    );

    const radioGroup = baseElement.querySelector("goa-radio-group[testId='Option Label-radio-group']");
    expect(radioGroup).toBeInTheDocument();
    expect(radioGroup?.getAttribute('name')).toBe(label);
  });

  it('returns rank only for radio format enum controls', () => {
    const ranked = GoARadioGroupControlTester(
      { type: 'Control', scope: '#/properties/options', options: { format: 'radio' } } as unknown as UISchemaElement,
      { type: 'object', properties: { options: { type: 'string', enum: ['one'] } } } as unknown as object,
      undefined as unknown as object
    );
    const notRanked = GoARadioGroupControlTester(
      { type: 'Control', scope: '#/properties/options', options: { format: 'select' } } as unknown as UISchemaElement,
      { type: 'object', properties: { options: { type: 'string', enum: ['one'] } } } as unknown as object,
      undefined as unknown as object
    );

    expect(ranked).toBe(20);
    expect(notRanked).toBe(-1);
  });

  it('calls handleChange with path on direct radio group change', () => {
    const handleChange = jest.fn();
    const { baseElement } = render(
      <RadioGroup
        data={undefined}
        id="radio"
        enabled={true}
        schema={{ enum: ['one', 'two'] }}
        uischema={{ type: 'Control' }}
        path="options"
        handleChange={handleChange}
        options={{}}
        config={{}}
        label="Options"
        isVisited={false}
        errors={''}
      />
    );

    const radioGroup = baseElement.querySelector("goa-radio-group[testId='options-radio-group']");
    expect(radioGroup).toBeInTheDocument();
    fireEvent(radioGroup as Element, new CustomEvent('_change', { detail: { value: 'two' } }));
    expect(handleChange).toHaveBeenCalledWith('options', 'two');
  });
});
