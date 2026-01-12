import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Ajv from 'ajv';
import { JsonForms } from '@jsonforms/react';
import { Category, UISchemaElement } from '@jsonforms/core';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext } from './context';
import { FormStepperOptionProps } from './FormStepperControl';
import PageStepperControl, { FormPagesView } from './PageStepperControl';
interface ExtendedFormStepperOptionProps extends FormStepperOptionProps {
  showNavButtons?: boolean;
}

/**
 * Mocks
 *
 * - RenderPages is a named export in the source file; ensure we mock the named export `RenderPages`.
 * - TaskList is a named export from ./TaskList/TaskList and must be mocked to avoid importing UI primitives.
 */
interface CategoryProps {
  isFirstPage?: boolean;
  isLastPage?: boolean;
  showNavButtons?: boolean;
  disableNext?: boolean;
  onSubmit?: () => void;
}

interface TaskListProps {
  categories: Array<{
    id: number;
    isVisited?: boolean;
  }>;
}

interface ButtonProps {
  ref?: React.RefObject<HTMLElement>;
  testid?: string;
  disabled?: boolean;
  type?: string;
  children: React.ReactNode;
}

type GoabButton = React.ComponentType<ButtonProps>;

jest.mock('./RenderPages', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- required so mock factory can be self-contained for Jest
  const React = require('react') as typeof import('react');
  return {
    __esModule: true,
    RenderPages: function ({ categoryProps }: { categoryProps?: CategoryProps }) {
      const ref = React.createRef();
      const submitHandler = () => {
        if (categoryProps && typeof categoryProps.onSubmit === 'function') categoryProps.onSubmit();
      };
      return React.createElement(
        'div',
        null,
        categoryProps?.showNavButtons && !categoryProps?.isFirstPage
          ? React.createElement('goa-button', { ref, testid: 'pages-prev-btn' }, 'Previous')
          : null,
        categoryProps?.showNavButtons && !categoryProps?.isLastPage
          ? React.createElement(
              'goa-button',
              { ref, type: 'submit', disabled: categoryProps?.disableNext, testid: 'pages-save-continue-btn' },
              'Next'
            )
          : null,
        categoryProps?.isLastPage
          ? React.createElement(
              'goa-button',
              {
                ref: (el: HTMLElement | null) => {
                  if (el && !el.hasAttribute('__submit-listener')) {
                    el.addEventListener('_click', submitHandler as EventListener);
                    // mark that we've attached the listener so repeated ref calls don't add duplicates
                    el.setAttribute('__submit-listener', 'true');
                  }
                },
                testid: 'pages-submit-btn',
              },
              'Submit'
            )
          : null
      );
    },
  };
});

jest.mock('./TaskList/TaskList', () => {
  return {
    __esModule: true,
    TaskList: (props: TaskListProps) => <div data-testid="mock-tasklist">{JSON.stringify(props)}</div>,
  };
});

// silence only the noisy "invalid form step status" error
const originalConsoleError = console.error;
console.error = (message?: unknown, ...rest: unknown[]) => {
  if (typeof message === 'string' && message.match('is an invalid form step status')) {
    return;
  }
  originalConsoleError(message as string | Error, ...rest);
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
    {
      type: 'Control',
      label: 'city',
      scope: '#/properties/address/properties/city',
      options: { placeholder: 'City' },
    },
  ],
} as unknown as Category;

const categorizationPages = {
  type: 'Categorization',
  label: 'Test Categorization',
  elements: [nameCategory, addressCategory],
  options: {
    variant: 'pages',
    testId: 'pages-test',
    showNavButtons: true,
    nextButtonLabel: 'Next',
    nextButtonType: 'primary',
    previousButtonLabel: 'Previous',
    previousButtonType: 'primary',
    componentProps: { controlledNav: true },
  },
};

const formData = {
  name: { firstName: 'Bob', lastName: 'Bing' },
  address: { street: 'Sesame', city: 'Seattle' },
};

const mockDispatch = jest.fn();

/**
 * renderWithStepper
 *
 * Creates a StepperContext with realistic props (schema, data, ajv, activeId, etc.)
 * Renders JsonForms to hydrate context (so validation, enumerators, etc. exist),
 * then renders <PageStepperControl /> with overrides you want to test.
 */
interface StepperProps {
  uischema: UISchemaElement;
  schema: typeof dataSchema;
  enabled: boolean;
  direction: 'column' | 'row';
  visible: boolean;
  path: string;
  ajv: Ajv;
  t: jest.Mock;
  locale: string;
  activeId: number;
  customDispatch: jest.Mock;
  data: typeof formData;
}

interface PageControlProps {
  totalPages: number;
  pageIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  variant: string;
  showNavButtons: boolean;
  nextButtonLabel: string;
  previousButtonLabel: string;
  nextButtonType: string;
  previousButtonType: string;
  disableNext: boolean;
  disablePrev: boolean;
  isReviewPage: boolean;
  onSubmit?: () => void;
}

function renderWithStepper(
  stepperOverrides: Partial<StepperProps> = {},
  pageControlOverrides: Partial<PageControlProps> = {}
) {
  const baseStepperProps = {
    uischema: categorizationPages as UISchemaElement,
    schema: dataSchema,
    enabled: true,
    direction: 'column' as const,
    visible: true,
    path: 'test-path',
    ajv: new Ajv({ allErrors: true, verbose: true }),
    t: jest.fn(),
    locale: 'en',
    activeId: 0,
    customDispatch: mockDispatch,
    data: formData,
  };
  const StepperProps = { ...baseStepperProps, ...stepperOverrides };

  const totalPages = (categorizationPages.elements || []).length;
  const pageIndex = (StepperProps.activeId ?? 0) as number;
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === totalPages - 1;

  const opts: FormStepperOptionProps = categorizationPages.options as unknown as FormStepperOptionProps;

  const defaultPageControlProps = {
    totalPages,
    pageIndex,
    isFirstPage,
    isLastPage,
    variant: 'pages',
    showNavButtons: (opts as ExtendedFormStepperOptionProps).showNavButtons !== false,
    nextButtonLabel: opts.nextButtonLabel || 'Next',
    previousButtonLabel: opts.previousButtonLabel || 'Previous',
    nextButtonType: opts.nextButtonType || 'primary',
    previousButtonType: opts.previousButtonType || 'primary',
    disableNext: false,
    disablePrev: false,
    isReviewPage: false,
    onSubmit: undefined,
  };

  const pageProps = { ...defaultPageControlProps, ...pageControlOverrides };

  return render(
    <JsonFormsStepperContextProvider StepperProps={StepperProps}>
      {/* hydrate stepper context so validate(), enumerators, etc. are defined */}
      <JsonForms
        uischema={categorizationPages as UISchemaElement}
        data={StepperProps.data}
        schema={dataSchema}
        ajv={StepperProps.ajv}
        renderers={[]}
      />
      <PageStepperControl
        {...pageProps}
        direction="column"
        uischema={categorizationPages as UISchemaElement}
        schema={dataSchema}
        enabled={true}
        visible={true}
        path=""
        ajv={new Ajv()}
        t={jest.fn()}
        locale="en"
      />
    </JsonFormsStepperContextProvider>
  );
}

describe('PageStepperControl', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('hides the Previous button on the first page', () => {
    const { baseElement } = renderWithStepper(
      { activeId: 0 },
      {
        pageIndex: 0,
        isFirstPage: true,
        isLastPage: false,
      }
    );

    const prevBtn = baseElement.querySelector("goa-button[testId='pages-prev-btn']");
    expect(prevBtn).toBeNull();

    const maybeNextBtn = baseElement.querySelector("goa-button[testId='pages-save-continue-btn']");
    if (maybeNextBtn) {
      expect(maybeNextBtn.getAttribute('disabled')).not.toBe('true');
    }
  });

  it('covers JSON-pointer with /properties segments, arrays and booleans via TaskList patchedCategories', () => {
    const categories = [
      {
        id: 0,
        scopes: ['#/properties/name/properties/firstName'],
        visible: true,
        isValid: true,
        isCompleted: true,
        uischema: {},
      },
      { id: 1, scopes: ['#/tags'], visible: true, isValid: true, isCompleted: true, uischema: {} },
      { id: 2, scopes: ['#/flag'], visible: true, isValid: true, isCompleted: true, uischema: {} },
      { id: 3, scopes: ['#/addr'], visible: true, isValid: true, isCompleted: true, uischema: {} },
    ];

    const data = {
      name: { firstName: 'Alice' },
      tags: [],
      flag: false,
      addr: { street: 'Main St' },
    };

    const ctx = {
      selectStepperState: () => ({
        categories: categories.map((c) => ({
          ...c,
          label: 'Test Category',
          uischema: { type: 'Category', label: 'Test', elements: [] } as Category,
        })),
        activeId: categories.length + 1,
        hasNextButton: true,
        hasPrevButton: true,
        path: '',
        isOnReview: false,
        isValid: true,
        maxReachedStep: categories.length,
      }),
      validatePage: jest.fn(),
      goToPage: jest.fn(),
      stepperDispatch: jest.fn(),
      selectIsDisabled: () => false,
      selectIsActive: () => true,
      selectPath: () => '',
      selectData: () => ({}),
      selectCategories: () => [],
      selectValidationMode: () => 'ValidateAndShow',
      handleChange: () => undefined,
      getControlProps: () => ({}),
      selectCategory: () => ({
        id: 0,
        label: 'Test Category',
        scopes: ['#/test'],
        visible: true,
        isValid: true,
        isCompleted: true,
        uischema: { type: 'Category', label: 'Test', elements: [] } as Category,
      }),
      goToTableOfContext: () => undefined,
      toggleShowReviewLink: () => undefined,
      selectNumberOfCompletedCategories: () => 0,
    };

    const props = {
      data,
      uischema: { type: 'Category', label: 'Test Category', options: { title: 'X' }, elements: [] } as Category,
      enabled: true,
      path: '',
      schema: dataSchema,
      direction: 'column' as const,
      visible: true,
      ajv: new Ajv({ allErrors: true, verbose: true }),
      t: jest.fn(),
      locale: 'en',
    };

    render(
      <JsonFormsStepperContext.Provider value={ctx}>
        <FormPagesView {...props} />
      </JsonFormsStepperContext.Provider>
    );

    const el = screen.queryByTestId('task-list') || screen.queryByTestId('mock-tasklist');
    expect(el).toBeTruthy();

    const raw = el?.getAttribute('data-props') || el?.textContent || '{}';
    const passed = JSON.parse(raw);

    // the tags array is empty -> should be marked as not visited/completed
    interface CategoryType {
      id: number;
      isVisited?: boolean;
    }
    const cat1 = passed.categories.find((c: CategoryType) => c.id === 1);
    expect(cat1).toBeDefined();
    expect(cat1.isVisited).toBe(false);

    // flag=false (boolean) counts as data -> should remain visited
    const cat2 = passed.categories.find((c: CategoryType) => c.id === 2);
    expect(cat2).toBeDefined();
    // either remains true or is present
    expect(cat2.isVisited).not.toBe(false);
  });
  it('shows both Previous and Next on a middle page and dispatches when clicked', () => {
    const { baseElement } = renderWithStepper(
      { activeId: 1 },
      {
        pageIndex: 1,
        isFirstPage: false,
        isLastPage: false,
      }
    );

    // debug: dump rendered HTML when buttons not found

    const prevBtn = baseElement.querySelector("goa-button[testId='pages-prev-btn']");
    const nextBtn = baseElement.querySelector("goa-button[testId='pages-save-continue-btn']");

    expect(prevBtn).not.toBeNull();
    expect(nextBtn).not.toBeNull();

    if (prevBtn) {
      fireEvent(prevBtn, new CustomEvent('_click'));
    }
    if (nextBtn) {
      fireEvent(nextBtn, new CustomEvent('_click'));
    }

    const dispatchedTypes = mockDispatch.mock.calls.map((c) => c[0]?.type).filter(Boolean);
    expect(dispatchedTypes.length).toBeGreaterThan(0);
  });

  it('on the last page: no next-button, submit/save button instead, and calls onSubmit if provided', () => {
    const onSubmit = jest.fn();

    const { baseElement } = renderWithStepper(
      { activeId: 1 },
      {
        pageIndex: 1,
        isFirstPage: false,
        isLastPage: true,
        onSubmit,
        nextButtonLabel: 'Submit',
      }
    );

    const nextBtn = baseElement.querySelector("goa-button[testId='pages-save-continue-btn']");
    expect(nextBtn).toBeNull();

    const possibleSubmit =
      baseElement.querySelector("goa-button[testId='pages-save-continue-btn']") ||
      baseElement.querySelector("goa-button[testId='pages-submit-btn']");

    expect(possibleSubmit).not.toBeNull();

    if (possibleSubmit) {
      fireEvent(possibleSubmit, new CustomEvent('_click'));
    }

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('on the last page with NO onSubmit handler falls back to dispatch', () => {
    const { baseElement } = renderWithStepper(
      { activeId: 1 },
      {
        pageIndex: 1,
        isFirstPage: false,
        isLastPage: true,
        onSubmit: undefined,
      }
    );

    const possibleSubmit =
      baseElement.querySelector("goa-button[testId='pages-save-continue-btn']") ||
      baseElement.querySelector("goa-button[testId='pages-submit-btn']");

    expect(possibleSubmit).not.toBeNull();

    if (possibleSubmit) {
      fireEvent(possibleSubmit, new CustomEvent('_click'));
    }

    const dispatchedTypes = mockDispatch.mock.calls.map((c) => c[0]?.type).filter(Boolean);
    expect(dispatchedTypes.length).toBeGreaterThan(0);
  });

  it('renders no nav controls when showNavButtons=false', () => {
    const { baseElement } = renderWithStepper(
      { activeId: 1 },
      {
        pageIndex: 1,
        isFirstPage: false,
        isLastPage: false,
        showNavButtons: false,
      }
    );

    const prevBtn = baseElement.querySelector("goa-button[testId='pages-prev-btn']");
    const nextBtn = baseElement.querySelector("goa-button[testId='pages-save-continue-btn']");
    const submitBtn =
      baseElement.querySelector("goa-button[testId='pages-save-continue-btn']") ||
      baseElement.querySelector("goa-button[testId='pages-submit-btn']");

    expect(prevBtn).toBeNull();
    expect(nextBtn).toBeNull();
    expect(submitBtn).toBeNull();
  });

  it('disables next button when disableNext=true', () => {
    const { baseElement } = renderWithStepper(
      { activeId: 1 },
      {
        pageIndex: 1,
        isFirstPage: false,
        isLastPage: false,
        disableNext: true,
      }
    );
    // console.log(baseElement.innerHTML);
    const nextBtn = baseElement.querySelector("goa-button[testId='pages-save-continue-btn']");
    expect(nextBtn).not.toBeNull();
    if (nextBtn) {
      expect(nextBtn.getAttribute('disabled')).toBe('true');
    }
  });
});
