import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Category } from '@jsonforms/core';
import { RenderStepElements, StepProps } from './RenderStepElements';
import { GoARenderers } from '../../../index';

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
      elements: [addressCategory],
      options: { variant: 'stepper', componentProps: { controlledNav: true } },
    },
  ],
} as unknown as Category;

const StepperElementProps: StepProps = {
  category: nameCategory,
  categoryIndex: 0,
  schema: dataSchema,
  visible: true,
  enabled: true,
  path: 'test-path',
  renderers: GoARenderers,
  cells: undefined,
};

describe('Render Step Elements', () => {
  it('can render a category', () => {
    const renderer = render(<RenderStepElements {...StepperElementProps} />);
    const firstName = renderer.getByPlaceholderText('First name');
    expect(firstName).toBeVisible();
    const lastName = renderer.getByPlaceholderText('Last name');
    expect(lastName).toBeVisible();
  });

  it("won't be visible if not current step", () => {
    const renderer = render(<RenderStepElements {...{ ...StepperElementProps, visible: false }} />);
    const firstName = renderer.queryByPlaceholderText('First name');
    expect(firstName).not.toBeVisible();
    const lastName = renderer.queryByPlaceholderText('Last name');
    expect(lastName).not.toBeVisible();
  });
});
