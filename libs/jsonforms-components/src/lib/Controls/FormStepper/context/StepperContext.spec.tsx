import { Dispatch } from 'react';
import React, { useContext } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './index';
import { CategorizationStepperLayoutRendererProps } from '../types';
import { StepperContextDataType } from './types';

import Ajv, { ErrorObject } from 'ajv';
import { stepperReducer } from './reducer';
import { subErrorInParent, hasDataInScopes } from './util';

describe('Test jsonforms stepper context', () => {
  const ajvInstance = new Ajv({ allErrors: true, verbose: true, strict: false });
  afterEach(() => {
    jest.clearAllMocks();
  });
  const mockDispatch = jest.fn();
  const schema = {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
    },
  };

  const schemaWithRequired = {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
    },
    required: ['firstName'],
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
    // eslint-disable-next-line
  } as unknown as CategorizationStepperLayoutRendererProps & { customDispatch: Dispatch<any> };

  const ComponentForTest = (): JSX.Element => {
    const ctx = useContext(JsonFormsStepperContext);
    const { selectStepperState, selectPath, selectIsDisabled, selectIsActive, selectCategory, goToPage } =
      ctx as JsonFormsStepperContextProps;
    return (
      <div>
        <div data-testid="number-of-category">
          {selectStepperState().categories.length === 1 ? 'Found' : 'Not found'}
        </div>
        <div data-testid="path-of-category">{selectPath() === 'test-path' ? 'Found' : 'Not found'}</div>
        <div data-testid="disabled-of-category">{selectIsDisabled() === false ? 'Found' : 'Not found'}</div>
        <div data-testid="active-of-category">{selectIsActive(0) === true ? 'Found' : 'Not found'}</div>
        <div data-testid="0-of-category">{selectCategory(0).id === 0 ? 'Found' : 'Not found'}</div>
      </div>
    );
  };

  const ComponentForTestWithGoToPage = (): JSX.Element => {
    const ctx = useContext(JsonFormsStepperContext);
    const { goToPage } = ctx as JsonFormsStepperContextProps;
    return (
      <div>
        <button
          data-testid="go-to-0"
          onClick={() => {
            goToPage(0);
          }}
        >
          Go 1
        </button>
        <button
          data-testid="go-to-0-0"
          onClick={() => {
            goToPage(0, 1);
          }}
        >
          Go 1 with update
        </button>
      </div>
    );
  };

  it('can render jsonforms stepper context provider', async () => {
    const stepper = render(
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={<ComponentForTest />} />
    );
    expect(stepper).toBeTruthy();
  });

  it('can render jsonforms stepper context provider with required field', async () => {
    render(
      <JsonFormsStepperContextProvider
        StepperProps={{ ...stepperBaseProps, schema: schemaWithRequired }}
        children={<ComponentForTest />}
      />
    );
    expect(screen.getByTestId('number-of-category').textContent).toContain('Found');
    expect(screen.getByTestId('path-of-category').textContent).toContain('Found');
    expect(screen.getByTestId('disabled-of-category').textContent).toContain('Found');
    expect(screen.getByTestId('active-of-category').textContent).toContain('Found');
  });
  it('can render jsonforms stepper context provider without required field', async () => {
    render(
      <JsonFormsStepperContextProvider
        StepperProps={{ ...stepperBaseProps, schema: schema }}
        children={<ComponentForTest />}
      />
    );
    expect(screen.getByTestId('number-of-category').textContent).toContain('Found');
  });

  it('can go to category with required', async () => {
    const { getByTestId } = render(
      <JsonFormsStepperContextProvider
        StepperProps={{ ...stepperBaseProps, schema: schemaWithRequired }}
        children={<ComponentForTestWithGoToPage />}
      />
    );
    const to0CategoryBtn = getByTestId('go-to-0');
    const to0CategoryBtnWithUpdate = getByTestId('go-to-0-0');

    fireEvent.click(to0CategoryBtn);
    fireEvent.click(to0CategoryBtnWithUpdate);

    expect(mockDispatch.mock.calls[4][0].type === 'page/to/index');
  });

  it('can run reducer actions ', async () => {
    const stateOneCategory: StepperContextDataType = {
      activeId: 0,
      hasNextButton: false,
      hasPrevButton: false,
      path: 'test-path',
      isOnReview: false,
      isValid: false,
      maxReachedStep: 0,
      categories: [
        {
          isCompleted: false,
          isVisited: false,
          isValid: false,
          id: 0,
          isEnabled: true,
          scopes: [],
          label: 'First category',
        },
      ],
    };
    const stateTwoCategory: StepperContextDataType = {
      activeId: 0,
      hasNextButton: false,
      hasPrevButton: false,
      path: 'test-path',
      isOnReview: false,
      isValid: false,
      maxReachedStep: 0,
      categories: [
        {
          isCompleted: false,
          isVisited: false,
          isValid: false,
          id: 0,
          isEnabled: true,
          scopes: ['#/properties/firstName'],
          label: 'First category',
        },
        {
          isCompleted: false,
          isVisited: false,
          isValid: true,
          id: 1,
          isEnabled: true,
          scopes: ['#/properties/secondName'],
          label: 'Second category',
        },
      ],
    };

    expect(stepperReducer(stateOneCategory, { type: 'page/next' }).isOnReview).toBe(true);
    expect(stepperReducer(stateTwoCategory, { type: 'page/next' }).isOnReview).toBe(false);
    expect(stepperReducer(stateTwoCategory, { type: 'page/prev' }).activeId).toBe(0);
    expect(stepperReducer({ ...stateTwoCategory, activeId: 1 }, { type: 'page/prev' }).activeId).toBe(0);
    expect(stepperReducer({ ...stateTwoCategory, activeId: 1 }, { type: 'page/prev' }).hasPrevButton).toBe(false);
    expect(
      stepperReducer({ ...stateTwoCategory, activeId: 1 }, { type: 'page/to/index', payload: { id: 0 } }).activeId
    ).toBe(0);
    expect(
      stepperReducer({ ...stateTwoCategory, activeId: 0 }, { type: 'page/to/index', payload: { id: 2 } }).isOnReview
    ).toBe(true);

    expect(
      stepperReducer(
        { ...stateTwoCategory, activeId: 0 },
        {
          type: 'update/category',
          payload: {
            ajv: ajvInstance,
            id: 0,
            errors: [],
            schema: { type: 'object', properties: {} },
            data: {},
          },
        }
      ).categories[0].isValid
    ).toBe(true);

    expect(
      stepperReducer(
        { ...stateTwoCategory, activeId: 0 },
        {
          type: 'update/category',
          payload: {
            ajv: ajvInstance,
            id: 1,
            errors: [
              {
                keyword: 'required',
                instancePath: '/secondName',
                schemaPath: '',
                params: {},
              },
            ],
            schema: { type: 'object', properties: {} },
            data: {},
          },
        }
      ).categories[1].isValid
    ).toBe(true);
    expect(
      stepperReducer(
        { ...stateTwoCategory, activeId: 0 },
        {
          type: 'validate/form',
          payload: {
            errors: [
              {
                keyword: 'required',
                instancePath: '/secondName',
                schemaPath: '',
                params: {},
              },
            ],
          },
        }
      ).isValid
    ).toBe(false);
  });

  it('test the util', async () => {
    const error: ErrorObject = {
      instancePath: '/Users/0/firstname',
      schemaPath: '#/properties/Users/items/required',
      keyword: 'required',
      params: { missingProperty: 'firstname' },
      message: "must have required property 'firstname'",
      schema: ['firstname'],
      parentSchema: {
        type: 'object',
        title: 'Users',
        required: [Array],
        properties: [Object],
      },
      data: { lastname: 'test' },
    };
    ajvInstance.validate(schema, { Users: [{ lastname: 'test' }] });
    const result = subErrorInParent(error, ['/Users']);

    expect(result).toBe(true);

    expect(
      hasDataInScopes(
        {
          whichOfThemApplies: ['Access to condominium documents or records'],
        },
        ['#/properties/whichOfThemApplies']
      )
    ).toBe(true);

    expect(hasDataInScopes({}, ['#/properties/whichOfThemApplies'])).toBe(false);
  });
});
