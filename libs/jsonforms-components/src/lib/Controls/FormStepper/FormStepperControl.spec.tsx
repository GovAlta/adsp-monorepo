import { Dispatch } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Category, SchemaBasedCondition, UISchemaElement } from '@jsonforms/core';
import { ContextProviderFactory, GoARenderers } from '../../../index';
import Ajv from 'ajv';
import { JsonForms } from '@jsonforms/react';
import { FormStepperOptionProps } from './FormStepperControl';
import { getProperty } from './util/helpers';
import { CategorizationStepperLayoutRendererProps } from './types';
import { JsonFormsStepperContextProvider } from './context';
import exp from 'constants';

export const ContextProvider = ContextProviderFactory();

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
  required: ['name'],
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
    nextButtonLabel: 'testNext',
    nextButtonType: 'primary',
    previousButtonLabel: 'testPrevious',
    previousButtonType: 'primary',
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

const combineOptions = (uiSchema: UISchemaElement = categorization, componentProps: object | undefined) => {
  let schema = {
    ...uiSchema,
  };
  if (componentProps && schema.options && schema.options.componentProps) {
    schema.options.componentProps = {
      ...schema.options.componentProps,
      ...componentProps,
    };
  } else if (componentProps && schema.options) {
    schema.options.componentProps = componentProps;
  } else if (componentProps) {
    schema = {
      ...schema,
      options: { componentProps: componentProps },
    };
  }
  return schema;
};

const mockDispatch = jest.fn();

const stepperBaseProps: CategorizationStepperLayoutRendererProps = {
  uischema: categorization,
  schema: dataSchema,
  enabled: true,
  direction: 'column',
  visible: true,
  path: 'test-path',
  ajv: new Ajv({ allErrors: true, verbose: true }),
  t: jest.fn(),
  locale: 'en',
  activeId: 0,
  customDispatch: mockDispatch,
  // eslint-disable-next-line
} as unknown as CategorizationStepperLayoutRendererProps & { customDispatch: Dispatch<any> } & { activeId: number };

const getForm = (
  data: object,
  uiSchema: UISchemaElement = categorization,
  componentProps: object | undefined = undefined
): JSX.Element => {
  combineOptions(uiSchema, componentProps);

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
afterEach(() => {
  jest.clearAllMocks();
});
describe('Form Stepper Control', () => {
  it('can render an initial Categorization', () => {
    const renderer = render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
    );
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
    const renderer = render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
    );
    const step0 = renderer.getByTestId('step_0-content');
    expect(step0).toBeVisible();

    const step1 = renderer.getByTestId('step_1-content');
    expect(step1).toBeInTheDocument();
    expect(step1).not.toBeVisible();
  });

  it('can input a text value', () => {
    const renderer = render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
    );
    const lastName = renderer.getByTestId('last-name-input');
    expect(lastName).toBeInTheDocument();

    // input some characters
    fireEvent.change(lastName!, { target: { value: 'abc' } });

    // Check the value
    const newLastName = renderer.getByTestId('last-name-input');
    expect(newLastName).toHaveValue('abc');
  });

  it('will initialize form data', () => {
    const renderer = render(
      <JsonFormsStepperContextProvider
        StepperProps={stepperBaseProps}
        children={getForm({ ...formData, name: { firstName: 'Bob', lastName: 'Bing' } })}
      />
    );
    const lastName = renderer.getByTestId('last-name-input');
    expect(lastName).toHaveValue('Bing');
    const firstName = renderer.getByTestId('first-name-input');
    expect(firstName).toHaveValue('Bob');
  });

  it('will recognize an incomplete status', () => {
    const renderer = render(
      <JsonFormsStepperContextProvider
        StepperProps={stepperBaseProps}
        children={getForm({ ...formData, name: { lastName: 'Bing' } })}
      />
    );

    const stepperHeader = renderer.getByTestId('form-stepper-headers-stepper-test');
    const step1 = stepperHeader.querySelector('goa-form-step[text="Name"]');
    expect(step1).toBeInTheDocument();
    expect(step1!.getAttribute('status')).toBe('incomplete');
  });

  it('will recognize a complete status', () => {
    const renderer = render(
      <JsonFormsStepperContextProvider
        StepperProps={{ ...stepperBaseProps, data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } } }}
        children={getForm({ ...formData, name: { firstName: 'Bob', lastName: 'Bing' } })}
      />
    );

    const stepperHeader = renderer.getByTestId('form-stepper-headers-stepper-test');
    const step1 = stepperHeader.querySelector('goa-form-step[text="Name"]');
    expect(step1).toBeInTheDocument();
    expect(step1!.getAttribute('status')).toBe('complete');
  });

  describe('step navigation', () => {
    it('can navigate between steps with the nav buttons', async () => {
      const { container, getByTestId } = render(
        <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
      );
      window.HTMLElement.prototype.scrollIntoView = function () {};
      const stepperHeader = getByTestId('form-stepper-headers-stepper-test');
      expect(stepperHeader).toBeInTheDocument();

      expect(container.querySelector('goa-pages')?.getAttribute('current')).toBe('1');

      const nextButton = getByTestId('next-button');
      expect(nextButton).toBeInTheDocument();

      const shadowNext = nextButton.shadowRoot?.querySelector('button');
      expect(shadowNext).not.toBeNull();
      fireEvent.click(shadowNext!);
      expect(mockDispatch.mock.calls[1][0].type === 'update/category');
      expect(mockDispatch.mock.calls[1][0].payload.id === 0);
      expect(mockDispatch.mock.calls[3][0].type === 'page/to/index');
      expect(mockDispatch.mock.calls[3][0].id === 1);
    });

    it('will hide Prev Nav button on 1st step', () => {
      const { container, getByTestId, queryByTestId } = render(
        <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
      );
      const nextButton = getByTestId('next-button');
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).toBeVisible();
      const prevButton = queryByTestId('prev-button');
      expect(prevButton).toBeNull();
    });

    it('will show  Prev & Next Nav button on inner steps', () => {
      const newStepperProps = { ...stepperBaseProps };
      // eslint-disable-next-line
      newStepperProps.activeId = 1;
      const { container, getByTestId } = render(
        <JsonFormsStepperContextProvider StepperProps={newStepperProps} children={getForm(formData)} />
      );

      const prevButton = getByTestId('prev-button');
      expect(prevButton).toBeInTheDocument();

      const shadowNext = prevButton.shadowRoot?.querySelector('button');
      expect(shadowNext).not.toBeNull();
      fireEvent.click(shadowNext!);
      expect(mockDispatch.mock.calls[1][0].type === 'update/category');
      expect(mockDispatch.mock.calls[1][0].payload.id === 1);
      expect(mockDispatch.mock.calls[3][0].type === 'page/to/index');
      expect(mockDispatch.mock.calls[3][0].id === 0);
    });
  });

  describe('Test summary page', () => {
    it('will navigate to the correct page with edit button', () => {
      const newStepperProps = {
        ...stepperBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      // eslint-disable-next-line
      newStepperProps.activeId = 2;
      const { getByTestId } = render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm({ ...formData, name: { firstName: 'Bob', lastName: 'Bing' } })}
        />
      );
      const nameAnchor = getByTestId('Name-review-link');
      expect(nameAnchor).toBeInTheDocument();
      expect(nameAnchor).toBeVisible();
      expect(nameAnchor.innerHTML).toBe('Edit');
      const submit = getByTestId('stepper-submit-btn');
      expect(submit).toBeInTheDocument();
      expect(submit).toBeVisible();
      expect(submit.getAttribute('disabled')).toBe('false');
      fireEvent.click(nameAnchor);
      expect(mockDispatch.mock.calls[1][0].type === 'page/to/index');
    });

    it('will render a "view" anchor in read-only-mode', () => {
      const newStepperProps = {
        ...stepperBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      const onSubmit = jest.fn();
      // eslint-disable-next-line
      newStepperProps.activeId = 2;
      const { getByTestId } = render(
        <ContextProvider submit={{ submitForm: onSubmit }}>
          <JsonFormsStepperContextProvider
            StepperProps={newStepperProps}
            children={getForm(
              {
                name: { firstName: 'Bob', lastName: 'Bing' },
                address: { street: 'Sesame', city: 'Seattle' },
              },
              categorization,
              { readOnly: true }
            )}
          />
        </ContextProvider>
      );
      const nameAnchor = getByTestId('Name-review-link');
      expect(nameAnchor).toBeInTheDocument();
      expect(nameAnchor).toBeVisible();
      expect(nameAnchor.innerHTML).toBe('View');
      const submitBtn = getByTestId('stepper-submit-btn');
      const submitShadow = submitBtn.shadowRoot?.querySelector('button');
      expect(submitShadow).not.toBeNull();
      fireEvent.click(submitShadow!);
      expect(onSubmit).toBeCalledTimes(1);
    });
  });

  describe('submit tests', () => {
    it('will open a modal if no submit function is present', () => {
      const newStepperProps = {
        ...stepperBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      // eslint-disable-next-line
      newStepperProps.activeId = 2;
      const { getByTestId } = render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm({
            name: { firstName: 'Bob', lastName: 'Bing' },
            address: { street: 'Sesame', city: 'Seattle' },
          })}
        />
      );
      const submitBtn = getByTestId('stepper-submit-btn');
      const submitShadow = submitBtn.shadowRoot?.querySelector('button');
      expect(submitShadow).toBeTruthy();

      const modal = getByTestId('submit-confirmation');
      expect(modal).toBeInTheDocument();
      expect(modal.getAttribute('open')).toBe('false');
      fireEvent.click(submitShadow!);
      expect(modal.getAttribute('open')).toBe('true');
    });

    it('first page has next button is has componentProps', () => {
      const newStepperProps = {
        ...stepperBaseProps,
      };
      // eslint-disable-next-line
      newStepperProps.activeId = 1;
      const componentProps: FormStepperOptionProps = {
        nextButtonLabel: 'testNext',
        nextButtonType: 'primary',
        previousButtonLabel: 'testPrevious',
        previousButtonType: 'primary',
      };

      render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm(
            {
              name: { firstName: 'Bob', lastName: 'Bing' },
              address: { street: 'Sesame', city: 'Seattle' },
            },
            categorization,
            componentProps
          )}
        />
      );
      window.HTMLElement.prototype.scrollIntoView = function () {};
      const testNext = screen.getByText('testNext');
      expect(testNext).toHaveTextContent('testNext');
      const testPrev = screen.getByText('testPrevious');
      expect(testPrev).toHaveTextContent('testPrevious');
    });
  });
});
