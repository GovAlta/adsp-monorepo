import { Dispatch } from 'react';
import React, { useContext } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './index';
import { CategorizationStepperLayoutRendererProps } from '../types';
import Ajv from 'ajv';

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
    render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps}>
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
