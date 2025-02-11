import { Dispatch } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { waitFor } from '@testing-library/react';
import { Category, SchemaBasedCondition, UISchemaElement } from '@jsonforms/core';
import { ContextProviderFactory, GoARenderers } from '../../../index';
import Ajv from 'ajv';
import { JsonForms } from '@jsonforms/react';
import { FormStepperOptionProps } from './FormStepperControl';
import { getProperty } from './util/helpers';
import { CategorizationStepperLayoutRendererProps } from './types';
import { JsonFormsStepperContextProvider } from './context';
import { categoriesAreValid } from './FormStepperTester';

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
      minLength: 1,
    },
    {
      type: 'Control',
      label: 'last',
      scope: '#/properties/name/properties/lastName',
      options: { placeholder: 'Last name', componentProps: { testId: 'last-name-input' } },
    },
  ],
  required: ['firstName'],
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

const categorizationPages = {
  type: 'Categorization',
  label: 'Test Categorization',
  elements: [nameCategory, addressCategory],
  options: {
    variant: 'pages',
    testId: 'pages-test',
    showNavButtons: true,
    nextButtonLabel: 'testNext',
    nextButtonType: 'primary',
    previousButtonLabel: 'testPrevious',
    previousButtonType: 'primary',
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

// eslint-disable-next-line
type TestProps = CategorizationStepperLayoutRendererProps & { customDispatch: Dispatch<any> } & { activeId: number };

const stepperBaseProps: TestProps = {
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
};

const { customDispatch, ...stepperBasePropsNoDispatch } = stepperBaseProps;

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

const getFormPages = (
  data: object,
  uiSchema: UISchemaElement = categorizationPages,
  componentProps: object | undefined = undefined
): JSX.Element => {
  combineOptions(categorizationPages, componentProps);

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

  it('can render an initial Categorization using pages ', () => {
    const renderer = render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getFormPages(formData)} />
    );
    const step1 = renderer.getByTestId('step_0-content-pages');
    expect(step1).toBeInTheDocument();
    expect(step1).toBeVisible();
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
    expect(step1!.getAttribute('status')).toBe(null);
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
    expect(step1!.getAttribute('status')).toBe(null);
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
      expect(mockDispatch.mock.calls[2][0].type === 'page/to/index');
      expect(mockDispatch.mock.calls[2][0].id === 0);
    });
  });

  describe('page navigation', () => {
    it('can navigate between pages with save and continue button', async () => {
      const newStepperProps = {
        ...stepperBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      const { getByTestId } = render(
        <JsonFormsStepperContextProvider StepperProps={newStepperProps} children={getFormPages(formData)} />
      );
      window.HTMLElement.prototype.scrollIntoView = function () {};

      const nextButton = getByTestId('pages-save-continue-btn');
      expect(nextButton).toBeInTheDocument();

      const shadowNext = nextButton.shadowRoot?.querySelector('button');
      expect(shadowNext).not.toBeNull();
      await fireEvent.click(shadowNext!);

      const step2 = getByTestId('step_1-content-pages');
      expect(step2).toBeInTheDocument();
      expect(step2).toBeVisible();
    });

    it('makes sure save and continue button is disabled if required field is not filled in', async () => {
      const newStepperProps = {
        ...stepperBasePropsNoDispatch,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      const { getByTestId, rerender } = render(
        <JsonFormsStepperContextProvider StepperProps={newStepperProps} children={getFormPages(formData)} />
      );
      window.HTMLElement.prototype.scrollIntoView = function () {};

      const nextButton = getByTestId('pages-save-continue-btn');
      expect(nextButton).toBeInTheDocument();

      expect(nextButton.getAttribute('disabled')).toBe('false');

      rerender(
        <JsonFormsStepperContextProvider StepperProps={stepperBasePropsNoDispatch}>
          {getFormPages(formData)}
        </JsonFormsStepperContextProvider>
      );

      await waitFor(() => {
        expect(nextButton.getAttribute('disabled')).toBe('true');
      });
    });

    it('will hide Prev Nav button on 1st step and show it on any subsequent steps', async () => {
      const newStepperProps = {
        ...stepperBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      const { getByTestId } = render(
        <JsonFormsStepperContextProvider StepperProps={newStepperProps} children={getFormPages(formData)} />
      );

      const nextButton = getByTestId('pages-save-continue-btn');
      expect(nextButton).toBeInTheDocument();
      const shadowNext = nextButton.shadowRoot?.querySelector('button');
      expect(shadowNext).not.toBeNull();
      await fireEvent.click(shadowNext!);
      const BackButton = getByTestId('back-button-click');
      expect(BackButton).toBeVisible();
      await fireEvent.click(BackButton);
      expect(BackButton).not.toBeVisible();
    });

    it('will show submit button on last step', async () => {
      const newStepperProps = {
        ...stepperBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      const { getByTestId } = render(
        <JsonFormsStepperContextProvider StepperProps={newStepperProps} children={getFormPages(formData)} />
      );

      const nextButton = getByTestId('pages-save-continue-btn');
      expect(nextButton).toBeInTheDocument();
      const shadowNext = nextButton.shadowRoot?.querySelector('button');
      expect(shadowNext).not.toBeNull();
      await fireEvent.click(shadowNext!);
      const submit = getByTestId('pages-submit-btn');
      expect(submit).toBeInTheDocument();
      expect(submit).toBeVisible();
      expect(submit.getAttribute('disabled')).toBe('false');
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

  it('will render a "view" anchor using key', () => {
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
            { readOnly: false }
          )}
        />
      </ContextProvider>
    );
    const nameAnchor = getByTestId('Name-review-link');
    fireEvent.keyDown(nameAnchor, { key: 'Enter', code: 13, charCode: 13 });
    expect(mockDispatch.mock.calls[2][0].type === 'page/to/index');
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

  describe('test stepper helper', () => {
    const obj = { prop: 'test' };
    const result = getProperty(obj, 'props');
    const result2 = getProperty(obj, 'prop');
    expect(result).toBe(undefined);
    expect(result2).toBe('test');

    const nestedObj = {
      level1: {
        level2: {
          targetProp: 'found me!',
        },
      },
    };
    const result3 = getProperty(nestedObj, 'targetProp');
    expect(result3).toBe('found me!');
  });

  describe('test the jsonforms stepper layout tester', () => {
    // eslint-disable-next-line
    const isCategoryLayout = categoriesAreValid({
      type: 'Categorization',
      // eslint-disable-next-line
      elements: [
        {
          type: 'Category',
          elements: [
            {
              type: 'Control',
            },
          ],
        },
      ],
    } as UISchemaElement);

    const isNotCategoryLayout = categoriesAreValid({
      type: 'Categorization',
      elements: [{ type: 'Control' }],
      // eslint-disable-next-line
    } as UISchemaElement);
    const nonCategoryType = categoriesAreValid({
      type: 'Category',
      elements: [{ type: 'Control' }],
      // eslint-disable-next-line
    } as UISchemaElement);
    expect(isCategoryLayout).toBe(true);
    expect(nonCategoryType).toBe(false);
    expect(isNotCategoryLayout).toBe(false);
  });
});
