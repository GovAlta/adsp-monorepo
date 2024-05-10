import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RenderFormReviewFields } from './RenderFormReviewFields';
import { JsonForms } from '@jsonforms/react';
import { UISchemaElement } from '@jsonforms/core';
import Ajv from 'ajv8';
import { GoACells, GoARenderers } from '../../../../index';

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

// Remove irritating "undefined" is an invalid form step status message,
// since it actually is valid.
const originalConsoleError = console.error;
console.error = (message: unknown) => {
  if (typeof message === 'string' && !message.match('is an invalid form step status')) {
    originalConsoleError(message);
  }
};

const johnData = {
  firstName: 'John',
  testCategoryAddress: true,
  fileUploader: 'urn:ads:platform:file-service:v1:/files/791a90e4-6382-46c1-b0cf-a2c370e424f0',
};

const nameSchema = {
  type: 'Control',
  scope: '#/properties/firstName',
};

const citySchema = {
  type: 'Control',
  scope: '#/properties/address/properties/city',
};

const uploaderSchema = {
  type: 'Control',
  scope: '#/properties/fileUploader',
  options: {
    variant: 'button',
  },
};

const listUiSchema = {
  type: 'ListWithDetail',
  scope: '#/properties/people',
  options: {
    detail: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/firstName' },
        { type: 'Control', scope: '#/properties/lastName' },
      ],
    },
  },
};

const listCategory = {
  type: 'Category',
  elements: [listUiSchema],
};

const listCategorization = {
  type: 'Categorization',
  label: 'Test Categorization',
  elements: [listCategory],
  options: {
    variant: 'stepper',
    testId: 'stepper-test',
    showNavButtons: false,
    componentProps: { controlledNav: true },
  },
};

const listSchema = {
  type: 'object',
  properties: {
    people: {
      type: 'array',
      items: {
        type: 'object',
        properties: { firstName: { type: 'string' }, lastName: { type: 'string' } },
      },
    },
  },
};

const objectCategorization = {
  type: 'Categorization',
  label: 'Test Categorization',
  elements: [
    {
      type: 'Category',
      label: 'People',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              label: 'People',
              scope: '#/properties/people',
            },
          ],
        },
      ],
    },
  ],
  options: {
    variant: 'stepper',
    testId: 'stepper-test',
    showNavButtons: 'false',
    componentProps: {
      controlledNav: 'true',
    },
  },
};

const objectSchema = {
  type: 'object',
  properties: {
    people: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
        },
      },
    },
  },
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

describe('Render Form Review Fields', () => {
  it('will render a Control element', () => {
    const LoadComponent = () => (
      <RenderFormReviewFields elements={[nameSchema]} data={johnData} requiredFields={['firstName']} />
    );
    const renderer = render(<LoadComponent />);
    expect(renderer.getByText(/First name/)).toBeInTheDocument();
    expect(renderer.getByText(/John/)).toBeInTheDocument();
    expect(renderer.getByText(/\*:/)).toBeInTheDocument();
  });

  it('will render an asterisk on required fields', () => {
    const LoadComponent = () => (
      <RenderFormReviewFields elements={[nameSchema, citySchema]} data={johnData} requiredFields={['firstName']} />
    );
    const renderer = render(<LoadComponent />);
    expect(renderer.queryByText(/name \*/)).toBeInTheDocument();
    expect(renderer.queryByText(/City \*/)).toBeNull();
    expect(renderer.queryByText(/City/)).toBeInTheDocument();
  });

  it('will include file information', () => {
    const LoadComponent = () => (
      <RenderFormReviewFields elements={[uploaderSchema]} data={johnData} requiredFields={['firstName']} />
    );
    const renderer = render(<LoadComponent />);
    expect(renderer.getByText(/File uploader:/)).toBeInTheDocument();
  });

  it('will render a ListWithDetail element', () => {
    window.HTMLElement.prototype.scrollIntoView = function () {};
    const listData = {
      people: [
        { firstName: 'Bob', lastName: 'Bing' },
        { firstName: 'Polly', lastName: 'Pringle' },
      ],
    };
    const form = getForm(listSchema, listCategorization, listData);
    const renderer = render(form);
    // Step to review Page
    const nextButton = renderer.getByTestId('next-button');
    expect(nextButton).toBeInTheDocument();
    fireEvent(nextButton, new CustomEvent('_click'));
    const newStep = renderer.getByTestId('stepper-test');
    expect(newStep.getAttribute('step')).toBe('2');
    const summary = renderer.getByTestId('summary_step-content');
    expect(summary).toBeInTheDocument();
    expect(renderer.getByText('Polly')).toBeInTheDocument();
    expect(renderer.getByText('Pringle')).toBeInTheDocument();
    expect(renderer.getByText('Bob')).toBeInTheDocument();
    expect(renderer.getByText('Bing')).toBeInTheDocument();
  });

  it('will render an object array', () => {
    const objectData = {
      people: [
        { firstName: 'Bob', lastName: 'Bing' },
        { firstName: 'Polly', lastName: 'Pringle' },
      ],
    };
    const form = getForm(objectSchema, objectCategorization, objectData);
    const renderer = render(form);
    // Step to review Page
    const nextButton = renderer.getByTestId('next-button');
    expect(nextButton).toBeInTheDocument();
    fireEvent(nextButton, new CustomEvent('_click'));
    const newStep = renderer.getByTestId('stepper-test');
    expect(newStep.getAttribute('step')).toBe('2');
    const summary = renderer.getByTestId('summary_step-content');
    expect(summary).toBeInTheDocument();
    expect(renderer.getByText('Polly')).toBeInTheDocument();
    expect(renderer.getByText('Pringle')).toBeInTheDocument();
    expect(renderer.getByText('Bob')).toBeInTheDocument();
    expect(renderer.getByText('Bing')).toBeInTheDocument();
  });
});
