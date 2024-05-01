import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv8';
import { GoACells, GoARenderers } from '../../index';
import { UISchemaElement } from '@jsonforms/core';
import { render } from '@testing-library/react';
import { errMalformedScope } from './schemaValidation';

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

const getForm = (uiSchema: UISchemaElement) => {
  return (
    <JsonForms
      data={{}}
      schema={{}}
      uischema={uiSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );
};

describe('GoA Error Control', () => {
  it('can recognize an invalid scope prefix', () => {
    const uiSchema = { type: 'Control', scope: '/properties/foo' };
    const form = getForm(uiSchema);
    const renderer = render(form);
    const callout = renderer.container.querySelector('goa-callout');
    expect(callout).not.toBeNull();
    expect(callout?.innerHTML).toBe(errMalformedScope('/properties/foo'));
  });
});
