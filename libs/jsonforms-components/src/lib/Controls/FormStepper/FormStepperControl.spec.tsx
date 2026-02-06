import { Dispatch } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Category, UISchemaElement } from '@jsonforms/core';
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

const categorizationPagesWithHide = {
  type: 'Categorization',
  label: 'Test Categorization',
  elements: [
    {
      ...addressCategory,

      rule: {
        effect: 'HIDE',
        condition: {
          scope: '#/properties/name/properties/firstName-input',
          schema: { const: 'Bob' },
        },
      },
    },
    nameCategory,
  ],
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

const pagesBaseProps: TestProps = {
  uischema: categorizationPages,
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

afterEach(() => {
  jest.clearAllMocks();
});
describe('Form Stepper Control', () => {
  it('can render an initial Categorization', () => {
    const renderer = render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
    );
    // const step1 = renderer.getByTestId('step_0-content');
    // expect(step1).toBeInTheDocument();
    // expect(step1).toBeVisible();

    // const step2 = renderer.getByTestId('step_1-content');
    // expect(step2).toBeInTheDocument();

    // const step3 = renderer.queryByTestId('step_2-content');
    // expect(step3).toBeNull();

    // const summaryStep = renderer.getByTestId('summary_step-content');
    // expect(summaryStep).toBeInTheDocument();
  });

  it('can render a nested Categorization', () => {
    const renderer = render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
    );
    const step0 = renderer.getByTestId('step_0-content');
    expect(step0).toBeVisible();

    const step1 = renderer.getByTestId('step_1-content');
    expect(step1).toBeInTheDocument();
  });

  it('can input a text value', () => {
    const { baseElement } = render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
    );
    const lastName = baseElement.querySelector("goa-input[testId='last-name-input']");
    expect(lastName).toBeInTheDocument();

    // input some characters
    fireEvent(lastName!, new CustomEvent('_change', { detail: { value: 'abc' } }));
    // Check the value
    const newLastName = baseElement.querySelector("goa-input[testId='last-name-input']");

    expect(newLastName?.getAttribute('value')).toBe('abc');
  });

  it('will initialize form data', () => {
    const { baseElement } = render(
      <JsonFormsStepperContextProvider
        StepperProps={stepperBaseProps}
        children={getForm({ ...formData, name: { firstName: 'Bob', lastName: 'Bing' } })}
      />
    );
    const lastName = baseElement.querySelector("goa-input[testId='last-name-input']");
    expect(lastName?.getAttribute('value')).toBe('Bing');
    const firstName = baseElement.querySelector("goa-input[testId='first-name-input']");
    expect(firstName?.getAttribute('value')).toBe('Bob');
  });

  it('will recognize an incomplete status', () => {
    const { baseElement } = render(
      <JsonFormsStepperContextProvider
        StepperProps={stepperBaseProps}
        children={getForm({ ...formData, name: { lastName: 'Bing' } })}
      />
    );

    const step1 = baseElement.querySelector('goa-form-step[text="Name"]');
    expect(step1).toBeInTheDocument();
    expect(step1!.getAttribute('status')).toBe('incomplete');
  });

  it('will recognize a incomplete status', () => {
    const { baseElement } = render(
      <JsonFormsStepperContextProvider
        StepperProps={{ ...stepperBaseProps, data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } } }}
        children={getForm({ ...formData, name: { firstName: 'Bob', lastName: 'Bing' } })}
      />
    );
    const step1 = baseElement.querySelector('goa-form-step[text="Name"]');
    expect(step1).toBeInTheDocument();
    expect(step1!.getAttribute('status')).toBe('incomplete');
  });

  describe('step navigation', () => {
    it('can navigate between steps with the nav buttons', async () => {
      const { container, baseElement } = render(
        <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
      );
      window.HTMLElement.prototype.scrollIntoView = function () {};
      const stepperHeader = container.querySelector("goa-form-stepper[testId='form-stepper-headers-stepper-test']");
      expect(stepperHeader).toBeInTheDocument();

      expect(container.querySelector('goa-pages')?.getAttribute('current')).toBe('1');

      const nextButton = baseElement.querySelector("goa-button[testId='next-button']");
      expect(nextButton).toBeInTheDocument();

      fireEvent(nextButton!, new CustomEvent('_click'));

      expect(mockDispatch.mock.calls[1][0].type === 'update/category');
      expect(mockDispatch.mock.calls[1][0].payload.id === 0);
      expect(mockDispatch.mock.calls[3][0].type === 'page/to/index');
      expect(mockDispatch.mock.calls[3][0].id === 1);
    });

    it('will hide Prev Nav button on 1st step', () => {
      const { baseElement } = render(
        <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={getForm(formData)} />
      );
      const nextButton = baseElement.querySelector("goa-button[testId='next-button']");

      expect(nextButton).toBeInTheDocument();
      expect(nextButton).toBeVisible();
      const prevButton = baseElement.querySelector("goa-button[testId='prev-button']");
      expect(prevButton).toBeNull();
    });

    it('will show  Prev & Next Nav button on inner steps', () => {
      const newStepperProps = { ...stepperBaseProps };
      // eslint-disable-next-line
      newStepperProps.activeId = 1;
      const { baseElement } = render(
        <JsonFormsStepperContextProvider StepperProps={newStepperProps} children={getForm(formData)} />
      );

      const prevButton = baseElement.querySelector("goa-button[testId='prev-button']");
      expect(prevButton).toBeInTheDocument();

      fireEvent(prevButton!, new CustomEvent('_click'));

      expect(mockDispatch.mock.calls[2][0].type === 'page/to/index');
      expect(mockDispatch.mock.calls[2][0].id === 0);
    });
  });

  describe('page navigation', () => {
    it('will hide Prev Nav button on 1st step and show it on any subsequent steps', async () => {
      const newStepperProps = {
        ...stepperBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      newStepperProps.activeId = 1;
      const renderer = render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm(formData, categorizationPages)}
        />
      );
    });

    it('will show submit button on last step', async () => {
      const newStepperProps = {
        ...pagesBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      newStepperProps.activeId = 1;
      const renderer = render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm(formData, categorizationPages)}
        />
      );

      const nextButton = renderer.baseElement.querySelector("goa-button[testId='pages-save-continue-btn']");

      expect(nextButton).toBeInTheDocument();
      expect(nextButton).not.toBeNull();
      await fireEvent.click(nextButton!);
      expect(mockDispatch.mock.calls.length > 0).toBe(true);
    });

    it('can render the content table', async () => {
      const newStepperProps = {
        ...pagesBaseProps,

        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };

      const renderer = render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm(formData, categorizationPages)}
        />
      );

      const toc = renderer.getByTestId('table-of-contents');
      expect(toc).toBeInTheDocument();
      expect(toc).toBeVisible();
      const pageLink = renderer.getByTestId('page-ref-0');
      expect(pageLink).toBeVisible();
      fireEvent.click(pageLink);
      expect(mockDispatch.mock.calls.length > 0);
    });

    it('can render back to application button', async () => {
      const newStepperProps = {
        ...pagesBaseProps,

        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };

      const renderer = render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm(formData, categorizationPages)}
        />
      );

      const toc = renderer.getByTestId('table-of-contents');
      expect(toc).toBeInTheDocument();
      expect(toc).toBeVisible();
      const pageLink = renderer.getByTestId('page-ref-0');
      expect(pageLink).toBeVisible();
    });

    it('will render hide category', async () => {
      const newStepperProps = {
        ...{ ...pagesBaseProps, uischema: categorizationPagesWithHide },
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };

      newStepperProps.activeId = 2;
      const { getByTestId } = render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm(formData, categorizationPages)}
        />
      );
    });
  });

  describe('Test summary page', () => {
    it('will submit the form when all validations pass', () => {
      const newStepperProps = {
        ...stepperBaseProps,
        data: { ...formData, name: { firstName: 'Bob', lastName: 'Bing' } },
      };
      // eslint-disable-next-line
      newStepperProps.activeId = 2;
      const { baseElement } = render(
        <JsonFormsStepperContextProvider
          StepperProps={newStepperProps}
          children={getForm({
            name: { firstName: 'Bob', lastName: 'Bing' },
            address: { street: 'Sesame', city: 'Seattle' },
          })}
        />
      );
      const submitBtn = baseElement.querySelector("goa-button[testId='stepper-submit-btn']");

      expect(submitBtn).toBeTruthy();

      const modal = baseElement.querySelector("goa-modal[testId='submit-confirmation']");

      expect(modal).toBeInTheDocument();
      expect(modal!.getAttribute('open')).toBeFalsy();
      fireEvent(submitBtn!, new CustomEvent('_click'));
      expect(modal!.getAttribute('open')).toBe('true');
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
    it('should test getProperty function', () => {
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
  });

  describe('test the jsonforms stepper layout tester', () => {
    it('should test categoriesAreValid function', () => {
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
});
