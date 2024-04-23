import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv8';
import { GoACells, GoARenderers } from '../../index';
import { UISchemaElement } from '@jsonforms/core';
import { render } from '@testing-library/react';

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

const schema = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
    },
    middleInitial: {
      type: 'string',
    },
    lastName: {
      type: 'string',
    },
  },
};

const getUiSchema = (type: string) => {
  return {
    type: type,
    elements: [
      {
        type: 'Control',
        scope: '#/properties/firstName',
      },
      {
        type: 'Control',
        scope: '#/properties/middleInitial',
      },
      {
        type: 'Control',
        scope: '#/properties/lastName',
      },
    ],
  };
};

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

describe('Horizontal Layout control', () => {
  it('renders a horizontal row with a grid', () => {
    const form = getForm(schema, getUiSchema('HorizontalLayout'));
    const { container } = render(form);
    const grid = container.querySelector('div > :scope goa-grid');
    expect(grid).toBeInTheDocument();
  });

  it('renders a vertical row without a grid', () => {
    const form = getForm(schema, getUiSchema('VerticalLayout'));
    const { container } = render(form);
    const grid = container.querySelector('div > :scope goa-grid');
    expect(grid).toBeNull();
  });
});
