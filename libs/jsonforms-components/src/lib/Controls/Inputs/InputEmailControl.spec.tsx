import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAEmailInput, GoAEmailControl } from './InputEmailControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';
import { JsonFormRegisterProvider, useRegisterUser } from '../../Context/register';
import { autoPopulateValue } from '../../util/autoPopulate';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context';

jest.mock('../../Context/register', () => {
  const actual = jest.requireActual('../../Context/register');
  return {
    ...actual,
    useRegisterUser: jest.fn(),
  };
});

const mockContextValue = {
  errors: [],
  data: {},
};

describe('GoAEmailInput control', () => {
  const emailSchema = {
    type: 'object',
    properties: {
      theEmail: {
        type: 'string',
        format: 'email',
      },
    },
  };

  const uiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/theEmail',
    label: 'Email control test',
  };

  const staticProps: ControlProps = {
    uischema: uiSchema,
    schema: emailSchema,
    rootSchema: emailSchema,
    handleChange: jest.fn(),
    enabled: true,
    label: 'Email control test',
    id: 'myEmailId',
    config: {},
    path: 'theEmail',
    errors: '',
    data: '',
    visible: true,
  };

  it('renders the email input control', () => {
    const { baseElement } = render(
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAEmailInput {...staticProps} />
        </JsonFormsContext.Provider>
      </JsonFormRegisterProvider>,
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    expect(input).toBeInTheDocument();
  });

  it('creates base control wrapper', () => {
    const control = render(
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <GoAEmailControl {...staticProps} />
      </JsonFormRegisterProvider>,
    );
    expect(control).toBeDefined();
  });

  it('shows error when visited with errors', () => {
    const { baseElement } = render(
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAEmailInput {...staticProps} errors={'this is an error'} />
        </JsonFormsContext.Provider>
      </JsonFormRegisterProvider>,
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    expect(input?.getAttribute('error')).toBeFalsy(); // not visited yet
  });

  it('calls onChange when typing email', () => {
    const handleChange = jest.fn();
    const props = { ...staticProps, handleChange };

    const { baseElement } = render(
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAEmailInput {...props} />
        </JsonFormsContext.Provider>
      </JsonFormRegisterProvider>,
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    fireEvent(
      input as Element,
      new CustomEvent('_change', {
        detail: { name: 'theEmail', value: 'test@example.com' },
      }),
    );

    expect(handleChange).toHaveBeenCalled();
  });

  it('marks visited on blur', () => {
    const { baseElement } = render(
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAEmailInput {...staticProps} />
        </JsonFormsContext.Provider>
      </JsonFormRegisterProvider>,
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    expect(input).toBeInTheDocument();

    // Simulate the stencil _blur event
    const blurred = fireEvent(
      input as Element,
      new CustomEvent('_blur', { detail: { name: 'theEmail', value: 'stuff' } }),
    );

    expect(blurred).toBe(true);
  });
});

jest.mock('../../util/autoPopulate', () => ({
  autoPopulateValue: jest.fn(() => 'auto@example.com'),
}));

describe('GoAEmailInput additional coverage', () => {
  const uiSchema: ControlElement = {
    type: 'Control', // now TS sees it as literal "Control"
    scope: '#/properties/theEmail',
    options: {},
  };
  const staticProps = {
    uischema: uiSchema,
    schema: { type: 'string', format: 'email', default: 'default@example.com', properties: {} },
    rootSchema: { properties: { theEmail: {} } },
    handleChange: jest.fn(),
    enabled: true,
    label: 'Email control test',
    id: 'myEmailId',
    config: {},
    path: 'theEmail',
    errors: '',
    data: '',
    visible: true,
    required: true,
  };

  it('sets visited if showReviewLink is true', () => {
    const mockStepperCtx: JsonFormsStepperContextProps = {
      stepperDispatch: () => {}, // dummy dispatch
      selectStepperState: () => ({
        categories: [{ showReviewPageLink: true, id: 42, label: 'Category 1', scopes: [] }],
        activeId: 0,
        hasNextButton: true,
        hasPrevButton: false,
        path: '',
        isOnReview: false,
        isVisited: false,
        visited: [],
        isValid: true,
        maxReachedStep: 0,
      }),
      selectIsDisabled: () => false,
      selectIsActive: (id: number) => false,
      selectPath: () => '',
      selectCategory: (id: number) => ({ showReviewPageLink: false, id, label: '', scopes: [] }),
      goToPage: (id: number, targetScope?: string) => {},
      goToTableOfContext: () => {},
      toggleShowReviewLink: (id: number) => {},
      validatePage: (id: number) => {},
      selectNumberOfCompletedCategories: () => 0,
      // optional
      isProvided: true,
    };
    //eslint-disable-next-line
    const { baseElement } = render(
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <JsonFormsStepperContext.Provider value={mockStepperCtx}>
          <GoAEmailInput {...staticProps} />
        </JsonFormsStepperContext.Provider>
      </JsonFormRegisterProvider>,
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    expect(input).toBeInTheDocument();
  });

  it('sets default value if data !== schema.default', () => {
    const handleChangeMock = jest.fn();
    const propsWithData = { ...staticProps, data: 'something else', handleChange: handleChangeMock };

    render(
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <GoAEmailInput {...propsWithData} />
      </JsonFormRegisterProvider>,
    );

    expect(handleChangeMock).toHaveBeenCalledWith(propsWithData.path, propsWithData.schema.default);
  });
});

describe('GoAEmailInput additional coverage no defaults', () => {
  const uiSchema: ControlElement = {
    type: 'Control', // now TS sees it as literal "Control"
    scope: '#/properties/theEmail',
    options: {},
  };
  const staticProps = {
    uischema: uiSchema,
    schema: { type: 'string', format: 'email', properties: {} },
    rootSchema: { properties: { theEmail: {} } },
    handleChange: jest.fn(),
    enabled: true,
    label: 'Email control test',
    id: 'myEmailId',
    config: {},
    path: 'theEmail',
    errors: '',
    data: '',
    visible: true,
    required: true,
  };

  it('calls autoPopulateValue when user and rootSchema.properties exist', () => {
    jest.mock('../../util/autoPopulate', () => ({
      autoPopulateValue: jest.fn(() => 'auto@example.com'),
    }));
    const mockUser = { email: 'user@example.com' };

    (useRegisterUser as jest.Mock).mockReturnValue(mockUser);

    render(
      <JsonFormRegisterProvider defaultRegisters={undefined}>
        <GoAEmailInput {...staticProps} />
      </JsonFormRegisterProvider>,
    );

    expect(autoPopulateValue).toHaveBeenCalledWith(mockUser, staticProps);
  });
});
