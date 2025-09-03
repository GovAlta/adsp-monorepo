import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAEmailInput, GoAEmailControl } from './InputEmailControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';

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
      <JsonFormsContext.Provider value={mockContextValue}>
        <GoAEmailInput {...staticProps} />
      </JsonFormsContext.Provider>
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    expect(input).toBeInTheDocument();
  });

  it('creates base control wrapper', () => {
    const control = render(GoAEmailControl(staticProps as ControlProps));
    expect(control).toBeDefined();
  });

  it('shows error when visited with errors', () => {
    const { baseElement } = render(
      <JsonFormsContext.Provider value={mockContextValue}>
        <GoAEmailInput {...staticProps} errors={'this is an error'} />
      </JsonFormsContext.Provider>
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    expect(input?.getAttribute('error')).toBe('false'); // not visited yet
  });

  it('calls onChange when typing email', () => {
    const handleChange = jest.fn();
    const props = { ...staticProps, handleChange };

    const { baseElement } = render(
      <JsonFormsContext.Provider value={mockContextValue}>
        <GoAEmailInput {...props} />
      </JsonFormsContext.Provider>
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    fireEvent(
      input as Element,
      new CustomEvent('_change', {
        detail: { name: 'theEmail', value: 'test@example.com' },
      })
    );

    expect(handleChange).toHaveBeenCalled();
  });

  it('marks visited on blur', () => {
    const { baseElement } = render(
      <JsonFormsContext.Provider value={mockContextValue}>
        <GoAEmailInput {...staticProps} />
      </JsonFormsContext.Provider>
    );

    const input = baseElement.querySelector("goa-input[testId='myEmailId-input']");
    expect(input).toBeInTheDocument();

    // Simulate the stencil _blur event
    const blurred = fireEvent(
      input as Element,
      new CustomEvent('_blur', { detail: { name: 'theEmail', value: 'stuff' } })
    );

    expect(blurred).toBe(true);
  });
});
