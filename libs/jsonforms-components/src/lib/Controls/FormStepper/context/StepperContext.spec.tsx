import { Dispatch } from 'react';
import React, { useContext } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    customDispatch: mockDispatch,
  } as unknown as CategorizationStepperLayoutRendererProps & { customDispatch: Dispatch<any> };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const TestComponent = (): JSX.Element => {
    const ctx = useContext(JsonFormsStepperContext);
    const { selectStepperState, selectPath, selectIsDisabled, selectIsActive, selectCategory, goToPage } =
      ctx as JsonFormsStepperContextProps;

    return (
      <div>
        <div data-testid="path">{selectPath()}</div>
        <div data-testid="is-disabled">{selectIsDisabled().toString()}</div>
        <div data-testid="is-active">{selectIsActive(0).toString()}</div>
        <div data-testid="category-label">{selectCategory(0).label}</div>
        <button data-testid="go-to-page" onClick={() => goToPage(1)}>
          Go to Page
        </button>
      </div>
    );
  };

  test('provides the correct context values', () => {
    render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps}>
        <TestComponent />
      </JsonFormsStepperContextProvider>,
    );

    // Assert default path
    expect(screen.getByTestId('path').textContent).toBe('test-path');

    // Assert default isDisabled
    expect(screen.getByTestId('is-disabled').textContent).toBe('false');

    // Assert default isActive for step 0
    expect(screen.getByTestId('is-active').textContent).toBe('true');

    // Assert category label (falls back to Step 1 when no translation is resolved)
    expect(screen.getByTestId('category-label').textContent).toBe('Step 1');
  });

  test('goToPage updates active page', () => {
    render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps}>
        <TestComponent />
      </JsonFormsStepperContextProvider>,
    );

    // Ignore dispatches from provider lifecycle effects and assert click behavior only.
    mockDispatch.mockClear();

    // Trigger goToPage
    fireEvent.click(screen.getByTestId('go-to-page'));

    // Assert that the mock dispatch was called with the correct action
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'page/to/index', payload: { id: 1, targetScope: undefined } });
  });
});
