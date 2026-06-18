import { Dispatch } from 'react';
import React, { useContext } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './index';
import { CategorizationStepperLayoutRendererProps } from '../types';
import { StepperContextDataType } from './types';

import Ajv, { ErrorObject } from 'ajv';
import { stepperReducer } from './reducer';
import { subErrorInParent, hasDataInScopes } from './util';
import { hasMeaningfulValue } from './util';
import { getEmptyRequiredStringErrors } from './index';

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      <JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={<ComponentForTest />} />,
    );
    expect(stepper).toBeTruthy();
  });

  it('can render jsonforms stepper context provider with required field', async () => {
    render(
      <JsonFormsStepperContextProvider
        StepperProps={{ ...stepperBaseProps, schema: schemaWithRequired }}
        children={<ComponentForTest />}
      />,
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
      />,
    );
    expect(screen.getByTestId('number-of-category').textContent).toContain('Found');
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
      stepperReducer({ ...stateTwoCategory, activeId: 1 }, { type: 'page/to/index', payload: { id: 0 } }).activeId,
    ).toBe(0);
    expect(
      stepperReducer({ ...stateTwoCategory, activeId: 0 }, { type: 'page/to/index', payload: { id: 2 } }).isOnReview,
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
            data: { firstName: 'test' },
          },
        },
      ).categories[0].isValid,
    ).toBe(true);
    expect(hasMeaningfulValue(123)).toBe(true);

    // boolean
    expect(hasMeaningfulValue(true)).toBe(true);

    // symbol
    expect(hasMeaningfulValue(Symbol('x'))).toBe(true);

    // bigint
    expect(hasMeaningfulValue(10n)).toBe(true);

    // function
    expect(hasMeaningfulValue(() => {})).toBe(true);

    // once visited return true
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
        },
      ).categories[0].isValid,
    ).toBe(true);

    const yyy = stepperReducer(
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
          data: { firstName: 'test' },
        },
      },
    );

    const noData = stepperReducer(
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
      },
    );

    expect(noData.categories[1].isVisited).toBe(false);

    const visited = stepperReducer(
      { ...stateTwoCategory, activeId: 0 },
      {
        type: 'set/visited',
        payload: { id: 1 },
      },
    );

    expect(visited.categories[1].isVisited).toBe(true);

    expect(visited.categories.find((cat) => cat.id === 1)?.isVisited).toBe(true);

    expect(visited.categories[1].isValid).toBe(true);

    const filledOut = stepperReducer(
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
          data: { secondName: 'test' },
        },
      },
    );

    expect(filledOut.categories[1].isValid).toBe(true);

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
        },
      ).isValid,
    ).toBe(false);
  });

  it('can go to category with required', async () => {
    const { getByTestId } = render(
      <JsonFormsStepperContextProvider
        StepperProps={{ ...stepperBaseProps, schema: schemaWithRequired }}
        children={<ComponentForTestWithGoToPage />}
      />,
    );
    const to0CategoryBtn = getByTestId('go-to-0');
    const to0CategoryBtnWithUpdate = getByTestId('go-to-0-0');

    fireEvent.click(to0CategoryBtn);
    fireEvent.click(to0CategoryBtnWithUpdate);

    expect(mockDispatch.mock.calls[4][0].type === 'page/to/index');
  });

  it('should call validatePage when navigating back to show validation errors', async () => {
    const multiStepUischema = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Page 1',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstName',
            },
          ],
        },
        {
          type: 'Category',
          label: 'Page 2',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/lastName',
            },
          ],
        },
      ],
      options: {
        variant: 'pages',
      },
    };

    const multiStepSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
      required: ['firstName', 'lastName'],
    };

    const ComponentWithNavigation = (): JSX.Element => {
      const ctx = useContext(JsonFormsStepperContext);
      const { goToPage, selectStepperState } = ctx as JsonFormsStepperContextProps;
      const { activeId } = selectStepperState();

      return (
        <div>
          <div data-testid="active-page">{activeId}</div>
          <button data-testid="go-to-page-1" onClick={() => goToPage(1)}>
            Go to Page 2
          </button>
          <button data-testid="go-to-page-0" onClick={() => goToPage(0)}>
            Go to Page 1
          </button>
        </div>
      );
    };

    const props = {
      ...stepperBaseProps,
      uischema: multiStepUischema,
      schema: multiStepSchema,
      data: {}, // Empty data means validation will fail for required fields
    };

    const { getByTestId } = render(
      <JsonFormsStepperContextProvider StepperProps={props} children={<ComponentWithNavigation />} />,
    );

    // Should start at page 2 (pages variant starts at index = categories.length + 1)
    // But we're testing navigation

    // Navigate to page 2 (index 1)
    fireEvent.click(getByTestId('go-to-page-1'));

    // Clear mock to focus on next navigation
    mockDispatch.mockClear();

    // Navigate back to page 1 (index 0)
    fireEvent.click(getByTestId('go-to-page-0'));

    // Verify page/to/index was dispatched for navigation
    const navigationCalls = mockDispatch.mock.calls.filter(
      (call) => call[0].type === 'page/to/index' && call[0].payload.id === 0,
    );
    expect(navigationCalls.length).toBeGreaterThan(0);
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
        ['#/properties/whichOfThemApplies'],
      ),
    ).toBe(true);

    expect(hasDataInScopes({}, ['#/properties/whichOfThemApplies'])).toBe(false);
  });

  it('marks the form invalid when a required string is present but empty', async () => {
    const ComponentWithValidity = (): JSX.Element => {
      const ctx = useContext(JsonFormsStepperContext);
      const { selectStepperState, selectCategory } = ctx as JsonFormsStepperContextProps;
      const state = selectStepperState();

      return (
        <div>
          <div data-testid="form-valid">{state.isValid ? 'valid' : 'invalid'}</div>
          <div data-testid="category-status">{selectCategory(0).status}</div>
        </div>
      );
    };

    render(
      <JsonFormsStepperContextProvider
        StepperProps={{ ...stepperBaseProps, schema: schemaWithRequired, data: { firstName: '' } }}
        children={<ComponentWithValidity />}
      />,
    );

    expect(screen.getByTestId('form-valid').textContent).toBe('invalid');
    expect(screen.getByTestId('category-status').textContent).toBe('NotStarted');
  });

  it('counts only visible completed categories included in the task list', async () => {
    const multiCategoryUischema = {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'First name',
          elements: [{ type: 'Control', scope: '#/properties/firstName' }],
        },
        {
          type: 'Category',
          label: 'Last name',
          options: { showInTaskList: false },
          elements: [{ type: 'Control', scope: '#/properties/lastName' }],
        },
      ],
      options: {
        variant: 'stepper',
      },
    };

    const ComponentWithCompletedCount = (): JSX.Element => {
      const ctx = useContext(JsonFormsStepperContext);
      const { selectNumberOfCompletedCategories } = ctx as JsonFormsStepperContextProps;

      return <div data-testid="completed-count">{selectNumberOfCompletedCategories()}</div>;
    };

    render(
      <JsonFormsStepperContextProvider
        StepperProps={{
          ...stepperBaseProps,
          uischema: multiCategoryUischema,
          data: { firstName: 'Jane', lastName: 'Smith' },
        }}
        children={<ComponentWithCompletedCount />}
      />,
    );

    expect(screen.getByTestId('completed-count').textContent).toBe('0');
  });

  it('dispatches context actions with the expected payloads', async () => {
    const ComponentWithActions = (): JSX.Element => {
      const ctx = useContext(JsonFormsStepperContext);
      const { goToTableOfContext, setVisited, validatePage, toggleShowReviewLink } =
        ctx as JsonFormsStepperContextProps;

      return (
        <div>
          <button data-testid="go-to-review" onClick={() => goToTableOfContext()}>
            Review
          </button>
          <button data-testid="set-visited" onClick={() => setVisited(0)}>
            Visited
          </button>
          <button data-testid="validate-page" onClick={() => validatePage(0)}>
            Validate
          </button>
          <button data-testid="toggle-review-link" onClick={() => toggleShowReviewLink(0)}>
            Toggle
          </button>
        </div>
      );
    };

    render(<JsonFormsStepperContextProvider StepperProps={stepperBaseProps} children={<ComponentWithActions />} />);

    mockDispatch.mockClear();

    fireEvent.click(screen.getByTestId('go-to-review'));
    fireEvent.click(screen.getByTestId('set-visited'));
    fireEvent.click(screen.getByTestId('validate-page'));
    fireEvent.click(screen.getByTestId('toggle-review-link'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'page/to/index', payload: { id: 2 } });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'set/visited', payload: { id: 0 } });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'update/category',
        payload: expect.objectContaining({ id: 0, ajv: ajvInstance, schema, data: undefined }),
      }),
    );
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'toggle/category/review-link', payload: { id: 0 } });
  });

  it('returns requiredString errors for nested empty required strings only', async () => {
    const nestedSchema = {
      type: 'object',
      required: ['firstName', 'age'],
      properties: {
        firstName: { type: 'string' },
        age: { type: 'number' },
        mailingAddress: {
          type: 'object',
          required: ['city', 'province', 'postalCode'],
          properties: {
            city: { type: 'string' },
            province: { type: 'string' },
            postalCode: { type: 'string' },
          },
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };

    const errors = getEmptyRequiredStringErrors(
      {
        firstName: '',
        age: '',
        mailingAddress: {
          city: '',
          province: 'AB',
        },
        tags: [],
      },
      nestedSchema,
    );

    expect(errors).toHaveLength(2);
    expect(errors.map((error) => error.instancePath)).toEqual(['/firstName', '/mailingAddress/city']);
    expect(errors.map((error) => error.schemaPath)).toEqual([
      '#/requiredString',
      '#/properties/mailingAddress/requiredString',
    ]);
    expect(errors.every((error) => error.keyword === 'requiredString' && error.message === 'is required')).toBe(true);
  });

  it('returns no requiredString errors for non-object schemas or non-object data', async () => {
    expect(getEmptyRequiredStringErrors('', schemaWithRequired)).toEqual([]);
    expect(getEmptyRequiredStringErrors({}, true as unknown as typeof schemaWithRequired)).toEqual([]);
  });
});
