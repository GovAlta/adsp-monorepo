import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Category, UISchemaElement } from '@jsonforms/core';
import { GoARenderers } from '../../../index';
import Ajv from 'ajv';
import { JsonForms } from '@jsonforms/react';

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
console.error = (message: unknown) => {
  if (typeof message === 'string' && !message.match('is an invalid form step status')) {
    originalConsoleError(message);
  }
};

const nameSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
  },
  required: ['firstName'],
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
    preQualification: { type: 'boolean' },
  },
};

const nameCategory = {
  type: 'Category',
  label: 'Name',
  elements: [
    {
      type: 'Control',
      label: 'first',
      scope: '#/properties/name/properties/firstName',
      options: { placeholder: 'First name', componentProps: { testId: 'first-name-input' } },
    },
    {
      type: 'Control',
      label: 'last',
      scope: '#/properties/name/properties/lastName',
      options: { placeholder: 'Last name', componentProps: { testId: 'last-name-input' } },
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

const subCategorization = {
  type: 'Categorization',
  label: 'Test Categorization',
  elements: [categorization],
  options: {
    variant: 'stepper',
    testId: 'stepper-test',
    showNavButtons: true,
    componentProps: { controlledNav: true },
  },
};

const formData = {
  name: { firstName: undefined, lastName: undefined },
  address: { street: undefined, city: undefined },
};

const getForm = (data: object, uiSchema: UISchemaElement = categorization) => {
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

describe('Form Stepper Control', () => {
  it('can render an initial Categorization', () => {
    const renderer = render(getForm(formData));
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

  it('can render a nested Categorization', () => {
    const renderer = render(getForm(subCategorization));

    const step0 = renderer.getByTestId('step_0-content');
    expect(step0).toBeVisible();

    const step1 = renderer.getByTestId('step_1-content');
    expect(step1).toBeInTheDocument();
    expect(step1).not.toBeVisible();
  });

  it('initializes to the 1st step', () => {
    const renderer = render(getForm(formData));
    const currentStep = renderer.getByTestId('stepper-test');
    expect(currentStep).toBeInTheDocument();
    expect(currentStep.getAttribute('step')).toBe('1');
  });

  it('can input a text value', () => {
    const renderer = render(getForm(formData));
    const lastName = renderer.getByTestId('last-name-input');
    expect(lastName).toBeInTheDocument();

    // input some characters
    fireEvent.change(lastName!, { target: { value: 'abc' } });

    // Check the value
    const newLastName = renderer.getByTestId('last-name-input');
    expect(newLastName).toHaveValue('abc');
  });

  it('will initialize form data', () => {
    const form = getForm({ ...formData, name: { firstName: 'Bob', lastName: 'Bing' } });
    const renderer = render(form);
    const lastName = renderer.getByTestId('last-name-input');
    expect(lastName).toHaveValue('Bing');
    const firstName = renderer.getByTestId('first-name-input');
    expect(firstName).toHaveValue('Bob');
  });

  it('will recognize an incomplete status', () => {
    const form = getForm({ ...formData, name: { firstName: '', lastName: 'abc' } });
    const renderer = render(form);

    const stepperHeader = renderer.getByTestId('stepper-test');
    const step1 = stepperHeader.querySelector('goa-form-step[text="Name"]');
    expect(step1).toBeInTheDocument();
    expect(step1!.getAttribute('status')).toBe('incomplete');
  });

  it('will recognize a complete status', () => {
    const form = getForm({ ...formData, name: { firstName: 'Bob', lastName: 'Bing' } });
    const renderer = render(form);

    const stepperHeader = renderer.getByTestId('stepper-test');
    const step1 = stepperHeader.querySelector('goa-form-step[text="Name"]');
    expect(step1).toBeInTheDocument();
    expect(step1!.getAttribute('status')).toBe('complete');
  });

  describe('step navigation', () => {
    it('can navigate between steps with the nav buttons', async () => {
      const renderer = render(getForm(formData));

      const stepperHeader = renderer.getByTestId('stepper-test');
      expect(stepperHeader).toBeInTheDocument();
      expect(stepperHeader.getAttribute('step')).toBe('1');

      // Navigate to the 2nd page
      const nextButton = renderer.getByTestId('next-button');
      expect(nextButton).toBeInTheDocument();

      const shadowNext = nextButton.shadowRoot?.querySelector('button');
      expect(shadowNext).not.toBeNull();
      fireEvent.click(shadowNext!);

      const newStep = renderer.getByTestId('stepper-test');
      expect(newStep.getAttribute('step')).toBe('2');

      // Navigate back to the previous page
      const prevButton = renderer.getByTestId('prev-button');
      expect(prevButton).toBeInTheDocument();

      const shadowPrev = prevButton.shadowRoot?.querySelector('button');
      expect(shadowPrev).not.toBeNull();
      fireEvent.click(shadowPrev!);

      const theStep = renderer.getByTestId('stepper-test');
      expect(theStep.getAttribute('step')).toBe('1');
    });

    it('will hide Prev Nav button on 1st step', () => {
      const renderer = render(getForm(formData));
      const nextButton = renderer.getByTestId('next-button');
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).toBeVisible();
      const prevButton = renderer.queryByTestId('prev-button');
      expect(prevButton).toBeNull();
    });

    it('will show  Prev & Next Nav button on inner steps', () => {
      const renderer = render(getForm(formData));

      // Move to page 2
      const next = renderer.getByTestId('next-button');
      const nextShadow = next.shadowRoot?.querySelector('button');
      expect(nextShadow).not.toBeNull();
      fireEvent.click(nextShadow!);

      // ensure next is still visible
      expect(next).toBeInTheDocument();
      expect(next).toBeVisible();

      // ensure previous is visible.
      const prev1 = renderer.getByTestId('prev-button');
      expect(prev1).toBeInTheDocument();
      expect(prev1).toBeVisible();
    });

    it('will hide Next Nav button on last step', () => {
      const renderer = render(getForm(formData));

      // Move to page 3
      const next = renderer.getByTestId('next-button');
      const nextShadow = next.shadowRoot?.querySelector('button');
      expect(nextShadow).not.toBeNull();
      fireEvent.click(nextShadow!);
      fireEvent.click(nextShadow!);

      // ensure next is gone
      expect(next).not.toBeInTheDocument();

      // ensure previous is visible.
      const prev = renderer.getByTestId('prev-button');
      expect(prev).toBeInTheDocument();
      expect(prev).toBeVisible();
    });

    it('will bring Next button back', () => {
      const renderer = render(getForm(formData));

      // Move to page 3
      const next = renderer.getByTestId('next-button');
      const nextShadow = next.shadowRoot?.querySelector('button');
      expect(nextShadow).not.toBeNull();
      fireEvent.click(nextShadow!);
      fireEvent.click(nextShadow!);

      // ensure previous is visible.
      const prev = renderer.getByTestId('prev-button');
      const prevShadow = prev.shadowRoot?.querySelector('button');
      fireEvent.click(prevShadow!);

      // ensure next is back
      const newNext = renderer.getByTestId('next-button');
      expect(newNext).toBeInTheDocument();
      expect(newNext).toBeVisible();
    });

    it('will remove Prev button on 1st step', () => {
      const renderer = render(getForm(formData));

      // Move to page 3
      const next = renderer.getByTestId('next-button');
      const nextShadow = next.shadowRoot?.querySelector('button');
      expect(nextShadow).not.toBeNull();
      fireEvent.click(nextShadow!);
      fireEvent.click(nextShadow!);

      // and back again
      const prev = renderer.getByTestId('prev-button');
      const prevShadow = prev.shadowRoot?.querySelector('button');
      fireEvent.click(prevShadow!);
      fireEvent.click(prevShadow!);

      // ensure prev is gone
      expect(prev).not.toBeInTheDocument();
    });
  });

  describe('submit button', () => {
    it('is disabled if form is not complete', () => {
      const renderer = render(getForm(formData));
      // Move to review Page
      const next = renderer.getByTestId('next-button');
      const nextShadow = next.shadowRoot?.querySelector('button');
      expect(nextShadow).not.toBeNull();
      fireEvent.click(nextShadow!);
      fireEvent.click(nextShadow!);

      // Ensure submit is disabled.
      const submit = renderer.getByTestId('stepper-submit-btn');
      expect(submit).toBeInTheDocument();
      expect(submit).toBeVisible();
      expect(submit.getAttribute('disabled')).toBe('true');
    });

    it('is enabled if form is complete', () => {
      const form = getForm({
        name: { firstName: 'Bob', lastName: 'Bing' },
        address: { street: 'Sesame', city: 'Seattle' },
      });
      const renderer = render(form);

      // Move to review Page
      const next = renderer.getByTestId('next-button');
      const nextShadow = next.shadowRoot?.querySelector('button');
      expect(nextShadow).not.toBeNull();
      fireEvent.click(nextShadow!);
      fireEvent.click(nextShadow!);

      // Ensure submit is enabled.
      const submit = renderer.getByTestId('stepper-submit-btn');
      expect(submit).toBeInTheDocument();
      expect(submit).toBeVisible();
      expect(submit.getAttribute('disabled')).toBe('false');
    });
  });
});