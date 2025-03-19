import { render } from '@testing-library/react';
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

const getForm = (schema: object, uiSchema: UISchemaElement) => {
  return (
    <JsonForms
      data={{}}
      schema={schema}
      uischema={uiSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );
};

describe('Input Boolean Control', () => {
  it('can render a checkbox', () => {
    const dataSchema = { type: 'object', properties: { isAlive: { type: 'boolean' } } };
    const uiSchema = { type: 'Control', scope: '#/properties/isAlive', options: { text: 'Check Me' } };
    const { baseElement } = render(getForm(dataSchema, uiSchema));
    const checkbox = baseElement.querySelector("goa-checkbox[testId='isAlive-checkbox-test-id']");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox!.getAttribute('text')).toBe('Check Me');
  });

  it('can render a required checkbox', () => {
    const dataSchema = { type: 'object', properties: { isAlive: { type: 'boolean' } }, required: ['isAlive'] };
    const uiSchema = { type: 'Control', scope: '#/properties/isAlive', options: { text: 'Check Me' } };
    const { baseElement } = render(getForm(dataSchema, uiSchema));
    const checkbox = baseElement.querySelector("goa-checkbox[testId='isAlive-checkbox-test-id']");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox!.getAttribute('text')).toBe('Check Me (required)');
  });

  it('will use a description if no label', () => {
    const dataSchema = { type: 'object', properties: { isAlive: { type: 'boolean', title: 'Bob' } } };
    const uiSchema = { type: 'Control', scope: '#/properties/isAlive' };
    const { baseElement } = render(getForm(dataSchema, uiSchema));
    const checkbox = baseElement.querySelector("goa-checkbox[testId='isAlive-checkbox-test-id']");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox!.getAttribute('text')).toBe('Bob');
  });
});
