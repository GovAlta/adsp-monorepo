import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Category } from '@jsonforms/core';
import { GoARenderers } from '../../../index';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';

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
console.error = (message: string) => {
  if (!message.match('is an invalid form step status')) {
    originalConsoleError(message);
  }
};

const nameSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
  },
};

const addressSchema = {
  type: 'object',
  properties: {
    street: { type: 'string' },
    city: { type: 'string' },
  },
};

const dataSchema = {
  type: 'object',
  properties: {
    name: nameSchema,
    address: addressSchema,
  },
  required: ['firstName', 'city'],
};

const nameCategory = {
  type: 'Category',
  label: 'Name',
  elements: [
    {
      type: 'Control',
      label: 'first',
      scope: '#/properties/name/properties/firstName',
      options: { placeholder: 'First name' },
    },
    {
      type: 'Control',
      label: 'last',
      scope: '#/properties/name/properties/lastName',
      options: { placeholder: 'Last name' },
    },
  ],
} as unknown as Category;

const addressCategory = {
  type: 'Category',
  label: 'Address',
  elements: [
    {
      type: 'Control',
      label: 'street',
      scope: '#/properties/address/properties/street',
      options: { placeholder: 'Street' },
    },
    { type: 'Control', label: 'city', scope: '#/properties/address/properties/city', options: { placeholder: 'City' } },
  ],
} as unknown as Category;

const categorization = {
  type: 'Categorization',
  label: 'Test Categorization',
  elements: [nameCategory, addressCategory],
  options: {
    variant: 'stepper',
    testId: 'stepper-test',
    showNavButtons: true,
    componentProps: { controlledNav: true },
  },
};

const formData = {
  name: { firstName: '', lastName: '' },
  address: { street: '', city: '' },
};

const form = (
  <JsonForms
    ajv={new Ajv({ allErrors: true, verbose: true })}
    renderers={GoARenderers}
    onChange={() => {}}
    data={formData}
    validationMode={'ValidateAndShow'}
    schema={dataSchema}
    uischema={categorization}
  />
);

describe('Form Stepper Control', () => {
  it('can render an initial Categorization', () => {
    const renderer = render(form);
    const step1 = renderer.getByTestId('step_0-content');
    expect(step1).toBeInTheDocument();
    expect(step1).toBeVisible();

    const step2 = renderer.getByTestId('step_1-content');
    expect(step2).toBeInTheDocument();
    expect(step2).not.toBeVisible();

    const step3 = renderer.queryByTestId('step_2-content');
    expect(step3).toBeNull();

    const summaryStep = renderer.getByTestId('summary_step-content');
    expect(summaryStep).toBeInTheDocument();
    expect(summaryStep).not.toBeVisible();
  });

  it('initializes to the 1st step', () => {
    const renderer = render(form);
    const currentStep = renderer.getByTestId('stepper-test');
    expect(currentStep).toBeInTheDocument();
    expect(currentStep.getAttribute('step')).toBe('1');
  });

  it('indicates when a step is partially complete', () => {
    // Gotta change last name by hand ... fireEvent doesn't update the data object
    formData.name.lastName = 'Bing';
    const renderer = render(form);
    const lastName = renderer.getByTestId('#/properties/name/properties/lastName-input') as HTMLInputElement;
    expect(lastName).toBeInTheDocument();
    expect(lastName.value).toBe('Bing');

    const step1 = renderer.container.querySelector('goa-form-stepper goa-form-step');
    if (step1) {
      fireEvent.click(step1);
    }

    //console.log(renderer.baseElement.innerHTML);
  });
});
