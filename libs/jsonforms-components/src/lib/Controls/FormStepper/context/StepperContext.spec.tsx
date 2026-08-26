import { Dispatch } from 'react';
import React, { useContext } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './index';
import { CategorizationStepperLayoutRendererProps } from '../types';
import Ajv from 'ajv';
import { JsonFormContext } from '../../../Context';
import { getCategoryStatus, PageStatus } from '../CategoryStatus';

describe('JsonFormsStepperContext', () => {
  const ajvInstance = new Ajv({ allErrors: true, verbose: true, strict: false });
  const mockDispatch = jest.fn();

  const schema = {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
    },
  };

  const uischema = {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'Personal Information',
        elements: [
          {
            type: 'HorizontalLayout',
            elements: [
              {
                type: 'Control',
                scope: '#/properties/firstName',
              },
            ],
          },
        ],
      },
    ],
    options: {
      variant: 'stepper',
      showNavButtons: true,
    },
  };

  const stepperBaseProps: CategorizationStepperLayoutRendererProps = {
    uischema: uischema,
    schema: schema,
    enabled: true,
    direction: 'column',
    visible: true,
    path: 'test-path',
    ajv: ajvInstance,
    t: jest.fn(),
    locale: 'en',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as CategorizationStepperLayoutRendererProps & { customDispatch: Dispatch<any> };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const TestComponent = (): JSX.Element => {
    const ctx = useContext(JsonFormsStepperContext);
    const {
      selectStepperState,
      selectPath,
      selectIsDisabled,
      selectIsActive,
      selectCategory,
      goToPage,
      selectNumberOfCompletedCategories,
    } = ctx as JsonFormsStepperContextProps;

    return (
      <div>
        <div data-testid="path">{selectPath()}</div>
        <div data-testid="is-disabled">{selectIsDisabled().toString()}</div>
        <div data-testid="is-active">{selectIsActive(0).toString()}</div>
        <div data-testid="category-label">{selectCategory(0).label}</div>
        <div data-testid="completed-categories">{selectNumberOfCompletedCategories()}</div>
        <button data-testid="go-to-page" onClick={() => goToPage(1)}>
          Go to Page
        </button>
      </div>
    );
  };

  test('provides the correct context values for path and category', () => {
    // Arrange
    render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps}>
        <TestComponent />
      </JsonFormsStepperContextProvider>,
    );

    // Assert
    expect(screen.getByTestId('path').textContent).toBe('test-path');
    expect(screen.getByTestId('is-disabled').textContent).toBe('false');
    expect(screen.getByTestId('is-active').textContent).toBe('true');
    expect(screen.getByTestId('category-label').textContent).toBe('Step 1');
  });

  test('goToPage function updates the active page', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const propsWithDispatch = { ...stepperBaseProps, customDispatch: mockDispatch as any };
    render(
      <JsonFormsStepperContextProvider StepperProps={propsWithDispatch}>
        <TestComponent />
      </JsonFormsStepperContextProvider>,
    );

    // Act
    mockDispatch.mockClear();
    fireEvent.click(screen.getByTestId('go-to-page'));

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'page/to/index', payload: { id: 1, targetScope: undefined } });
  });

  test('selectNumberOfCompletedCategories returns correct count', () => {
    // Arrange
    render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps}>
        <TestComponent />
      </JsonFormsStepperContextProvider>,
    );

    // Assert
    expect(screen.getByTestId('completed-categories').textContent).toBe('0');
  });

  describe('external navigation', () => {
    const navigationUischema = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Personal details',
          options: { id: 'personal-details' },
          elements: [{ type: 'Control', scope: '#/properties/firstName' }],
        },
        {
          type: 'Category',
          label: 'Contact details',
          options: { id: 'contact-details' },
          elements: [{ type: 'Control', scope: '#/properties/lastName' }],
        },
      ],
      options: { variant: 'pages', showNavButtons: true },
    };

    const renderExternalStepper = (contextValue: Record<string, unknown>) =>
      render(
        <JsonFormContext.Provider value={contextValue}>
          <JsonFormsStepperContextProvider
            StepperProps={
              {
                ...stepperBaseProps,
                uischema: navigationUischema,
                data: { firstName: 'Alex' },
                customDispatch: mockDispatch,
              } as unknown as CategorizationStepperLayoutRendererProps
            }
          >
            <div />
          </JsonFormsStepperContextProvider>
        </JsonFormContext.Provider>,
      );

    test('navigates to the index resolved from an authored page id', () => {
      // Arrange
      const onNavigationChange = jest.fn();

      // Act
      renderExternalStepper({ navigationTarget: { pageId: 'contact-details' }, onNavigationChange });

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'page/to/index',
        payload: { id: 1, targetScope: undefined },
      });
    });

    test('passes a field scope through the existing page navigation action', () => {
      // Arrange
      const scope = '#/properties/lastName';

      // Act
      renderExternalStepper({ navigationTarget: { scope } });

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'page/to/index', payload: { id: 1, targetScope: scope } });
    });

    test('saves current form data before external navigation', () => {
      // Arrange
      const saveForm = jest.fn();
      const saveFunction = new Map([['save-form', () => saveForm]]);

      // Act
      renderExternalStepper({ navigationTarget: { pageId: 'contact-details' }, saveFunction });

      // Assert
      expect(saveForm).toHaveBeenCalledWith({ firstName: 'Alex' });
    });

    test('reports an unknown page without dispatching navigation', () => {
      // Arrange
      const onNavigationChange = jest.fn();

      // Act
      renderExternalStepper({ navigationTarget: { pageId: 'removed-page' }, onNavigationChange });

      // Assert
      expect(onNavigationChange).toHaveBeenCalledWith({
        status: 'unknown',
        requested: { pageId: 'removed-page' },
      });
    });
  });

  // CS-5233: a page whose fields are all auto-populated has no user data to derive "started" from,
  // so the recompute that runs on every data change must not discard what the user already visited.
  describe('auto-populated pages', () => {
    const autoPopulateSchema = {
      type: 'object',
      required: ['firstName'],
      properties: {
        firstName: { type: 'string' },
        notes: { type: 'string' },
      },
    };

    const autoPopulateUischema = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Your details',
          elements: [{ type: 'Control', scope: '#/properties/firstName', options: { autoPopulate: 'firstName' } }],
        },
        {
          type: 'Category',
          label: 'Other',
          elements: [{ type: 'Control', scope: '#/properties/notes' }],
        },
      ],
      options: { variant: 'stepper', showNavButtons: true },
    };

    const autoPopulatedData = [{ path: 'firstName', value: 'Bob' }];

    const StatusProbe = (): JSX.Element => {
      const ctx = useContext(JsonFormsStepperContext) as JsonFormsStepperContextProps;
      const { categories } = ctx.selectStepperState();

      return (
        <div>
          <div data-testid="status-0">{getCategoryStatus(categories[0])}</div>
          {/* What opening a page does: PageStepperControl validates it and it gets marked visited. */}
          <button
            data-testid="visit-0"
            onClick={() => {
              ctx.setVisited(0);
              ctx.validatePage(0);
            }}
          >
            visit
          </button>
        </div>
      );
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderStepper = (data: any) => (
      <JsonFormContext.Provider value={{ autoPopulatedData }}>
        <JsonFormsStepperContextProvider
          StepperProps={
            {
              ...stepperBaseProps,
              uischema: autoPopulateUischema,
              schema: autoPopulateSchema,
              data,
            } as unknown as CategorizationStepperLayoutRendererProps
          }
        >
          <StatusProbe />
        </JsonFormsStepperContextProvider>
      </JsonFormContext.Provider>
    );

    test('shows Not started before the page is opened, even though it is pre-filled', () => {
      // Arrange / Act
      render(renderStepper({ firstName: 'Bob' }));

      // Assert
      expect(screen.getByTestId('status-0').textContent).toBe(PageStatus.NotStarted);
    });

    test('keeps Completed when unrelated data changes after the page was opened', () => {
      // Arrange
      const { rerender } = render(renderStepper({ firstName: 'Bob' }));

      // Act: open the page, then type somewhere else in the form.
      act(() => {
        fireEvent.click(screen.getByTestId('visit-0'));
      });
      expect(screen.getByTestId('status-0').textContent).toBe(PageStatus.Complete);

      act(() => {
        rerender(renderStepper({ firstName: 'Bob', notes: 'something' }));
      });

      // Assert: the recompute must not drop it back to In progress.
      expect(screen.getByTestId('status-0').textContent).toBe(PageStatus.Complete);
    });

    test('shows a status on resume once the pre-filled value has been edited', () => {
      // Arrange / Act: a fresh mount, as after logging back in, with the name the user changed.
      render(renderStepper({ firstName: 'Robert' }));

      // Assert
      expect(screen.getByTestId('status-0').textContent).toBe(PageStatus.Complete);
    });
  });

  test('handles missing context gracefully', () => {
    // Arrange
    const MissingContextComponent = (): JSX.Element => {
      const ctx = useContext(JsonFormsStepperContext);
      return <div>{ctx ? 'Context Found' : 'Context Missing'}</div>;
    };

    // Act
    render(<MissingContextComponent />);

    // Assert
    expect(screen.getByText('Context Missing')).toBeInTheDocument();
  });
});
