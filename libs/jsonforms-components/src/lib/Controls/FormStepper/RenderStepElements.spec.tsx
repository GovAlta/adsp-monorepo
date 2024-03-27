import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Category, JsonSchema } from '@jsonforms/core';
import { CategorizationElement, RenderStepElements, StepProps } from './RenderStepElements';
import { GoARenderers } from '../../../index';

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

const subCategorization = {
  type: 'Category',
  label: 'Sub-Categorization',
  elements: [
    {
      type: 'Categorization',
      label: 'Sub Categories',
      elements: [nameCategory, addressCategory],
      options: { variant: 'stepper', componentProps: { controlledNav: true } },
    },
  ],
} as unknown as Category;

const getStepProps = (category: CategorizationElement, index: number, step: number, schema: JsonSchema): StepProps => {
  return {
    category,
    categoryIndex: index,
    step,
    schema,
    enabled: true,
    visible: true,
    path: 'bob',
    disabledCategoryMap: [false, false],
    renderers: GoARenderers,
    cells: undefined,
  };
};

describe('Render Step Elements', () => {
  it('can render a category', () => {
    const props = getStepProps(nameCategory, 0, 1, dataSchema);
    const renderer = render(<RenderStepElements {...props} />);
    const firstName = renderer.getByPlaceholderText('First name');
    expect(firstName).toBeVisible();
    const lastName = renderer.getByPlaceholderText('Last name');
    expect(lastName).toBeVisible();
  });

  it("won't render if not current step", () => {
    const props = getStepProps(nameCategory, 0, 2, dataSchema);
    const renderer = render(<RenderStepElements {...props} />);
    const firstName = renderer.queryByPlaceholderText('First name');
    expect(firstName).toBeNull();
    const lastName = renderer.queryByPlaceholderText('Last name');
    expect(lastName).toBeNull();
  });

  it('can render a nested Categorization', () => {
    const props = getStepProps(subCategorization, 0, 1, dataSchema);
    const renderer = render(<RenderStepElements {...props} />);

    const step0 = renderer.getByTestId('step_0-content');
    expect(step0).toBeVisible();

    const step1 = renderer.getByTestId('step_1-content');
    expect(step1).toBeInTheDocument();
    expect(step1).not.toBeVisible();
  });
});
