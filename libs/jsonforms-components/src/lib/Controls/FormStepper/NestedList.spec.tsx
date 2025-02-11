import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Category, UISchemaElement } from '@jsonforms/core';
import { ContextProviderFactory, GoARenderers } from '../../../index';
import Ajv from 'ajv';
import { JsonForms } from '@jsonforms/react';

export const ContextProvider = ContextProviderFactory();

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

class MockResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

// Optionally, stub any methods or properties your component uses from ResizeObserver
global.ResizeObserver = MockResizeObserver as never;

// Either mock deriveLabelForUISchemaElement or do a better job
// of mocking the Translator in FormStepperControl properties,
// otherwise we end up with a bunch of "not unique key" warnings in the tests.
jest.mock('@jsonforms/core', () => ({
  ...jest.requireActual('@jsonforms/core'),
  deriveLabelForUISchemaElement: jest.fn((c, _) => (c as Category).label),
}));

// Remove irritating "undefined" is an invalid form step status message,
// since it actually is valid.
const originalConsoleError = console.error;
console.error = (message: unknown) => {
  if (typeof message === 'string' && !message.match('is an invalid form step status')) {
    //originalConsoleError(message);
  }
};

const dataSchema = {
  type: 'object',
  properties: {
    roadmap: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
            maxLength: 400,
          },
          impacts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                impact: {
                  type: 'object',
                  properties: {
                    theImpact: {
                      type: 'string',
                    },
                    theDamage: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const listLayout = {
  type: 'ListWithDetail',
  scope: '#/properties/roadmap',
  options: {
    detail: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/title',
        },
        {
          type: 'Control',
          scope: '#/properties/description',
        },
        {
          type: 'ListWithDetail',
          scope: '#/properties/impacts',
          options: {
            detail: {
              type: 'VerticalControl',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/theImpact',
                },
                {
                  type: 'Control',
                  scope: '#/properties/theDamage',
                },
              ],
            },
          },
        },
      ],
    },
  },
};

const getForm = (data: object, uiSchema: UISchemaElement) => {
  return (
    <JsonForms
      uischema={uiSchema}
      data={data}
      schema={dataSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
    />
  );
};

const initialData = {
  roadmap: [
    {
      title: 'Bob',
      description: 'The rain in spain',
      impacts: [
        {
          theImpact: 'More rain in spain',
          theTime: 'today',
        },
      ],
    },
  ],
};

describe('Nested List Rendering', () => {
  it('can render a nested list', () => {
    const unCategorized = {
      type: 'VerticalLayout',
      elements: [listLayout],
    };
    const renderer = render(getForm(initialData, unCategorized));
    const roadmapBtn = renderer.getByTestId('object-array-toolbar-Roadmap');
    expect(roadmapBtn).toBeInTheDocument();
    expect(roadmapBtn).toBeVisible();
    const shadowRoadmapBtn = roadmapBtn.shadowRoot?.querySelector('button');
    expect(shadowRoadmapBtn).not.toBeNull();
    fireEvent.click(shadowRoadmapBtn!);

    const impactBtn = renderer.getByTestId('object-array-toolbar-Impacts');
    expect(impactBtn).toBeInTheDocument();
    expect(impactBtn).toBeVisible();
    const shadowImpactBtn = roadmapBtn.shadowRoot?.querySelector('button');
    expect(shadowImpactBtn).not.toBeNull();
    fireEvent.click(shadowImpactBtn!);
  });

  it('can render a categorized nested list', () => {
    const categorized = {
      type: 'Categorization',
      options: {
        variant: 'stepper',
        showNavButtons: true,
        componentProps: { controlledNav: true },
      },
      elements: [
        {
          type: 'Category',
          label: 'Overview',
          elements: [listLayout],
        },
      ],
    };

    const renderer = render(getForm(initialData, categorized));
    const step0 = renderer.getByTestId('step_0-content');
    expect(step0).toBeInTheDocument();
    expect(step0).toBeVisible();

    const roadmapBtn = renderer.getByTestId('object-array-toolbar-Roadmap');
    expect(roadmapBtn).toBeInTheDocument();
    expect(roadmapBtn).toBeVisible();
    const shadowRoadmapBtn = roadmapBtn.shadowRoot?.querySelector('button');
    expect(shadowRoadmapBtn).not.toBeNull();
    fireEvent.click(shadowRoadmapBtn!);

    const impactBtn = renderer.getByTestId('object-array-toolbar-Impacts');
    expect(impactBtn).toBeInTheDocument();
    expect(impactBtn).toBeVisible();
    const shadowImpactBtn = impactBtn.shadowRoot?.querySelector('button');
    expect(shadowImpactBtn).not.toBeNull();
    fireEvent.click(shadowImpactBtn!);
  });
});
