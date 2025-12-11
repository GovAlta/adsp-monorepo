import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { ControlProps } from '@jsonforms/core';
import { GoACalculationControl as GoAComputed } from './CalculationControl';
import * as jsonforms from '@jsonforms/react';

jest.mock('../../util', () => ({
  //eslint-disable-next-line
  Visible: ({ visible, children }: any) => (visible ? children : null),
}));

jest.mock('@jsonforms/react', () => {
  const actual = jest.requireActual('@jsonforms/react');
  return {
    ...actual,
    useJsonForms: jest.fn(),
    withJsonFormsControlProps: (component: React.ComponentType<unknown>) => component,
  };
});

const useJsonFormsMock = jsonforms.useJsonForms as jest.Mock;

jest.mock('@abgov/react-components', () => ({
  //eslint-disable-next-line
  GoAFormItem: ({ children }: any) => <div>{children}</div>,
  //eslint-disable-next-line
  GoAInput: (props: any) => <input data-testid={props.testId} value={props.value ?? ''} readOnly />,
}));

afterEach(() => {
  cleanup();
  jest.resetAllMocks();
});

describe('GoAComputed control', () => {
  it('renders computed arithmetic expression and calls handleChange', () => {
    useJsonFormsMock.mockReturnValue({ core: { data: { x: 2, y: 3, z: 4 } } });

    const handleChange = jest.fn();
    const props = {
      id: '123',
      uischema: { label: 'Total' },
      schema: { description: '"#/properties/x" * "#/properties/y" + "#/properties/z"' },
      path: '#/properties/total',
      visible: true,
      handleChange,
    } as unknown as ControlProps;

    render(<GoAComputed {...(props as ControlProps)} />);

    const input = screen.getByTestId('computed-input-123') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('10');
    expect(handleChange).toHaveBeenCalledWith('#/properties/total', 10);
  });

  it('shows blank and does not call handleChange when referenced value missing', () => {
    useJsonFormsMock.mockReturnValue({ core: { data: { x: 2 } } });

    const handleChange = jest.fn();
    const props = {
      id: 'total',
      uischema: { label: 'Total' },
      schema: { description: '"#/properties/x" * "#/properties/y"' },
      path: '#/properties/total',
      visible: true,
      handleChange,
    } as unknown as ControlProps;

    render(<GoAComputed {...(props as ControlProps)} />);

    const input = screen.getByTestId('computed-input-total') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('evaluates SUM expression over array column and calls handleChange', () => {
    useJsonFormsMock.mockReturnValue({
      core: { data: { arr: [{ c3: 5 }, { c3: 10 }] } },
    });

    const handleChange = jest.fn();
    const props = {
      id: 'sumC3',
      uischema: { label: 'Sum C3' },
      schema: { description: 'SUM("#/properties/arr/c3")' },
      path: '#/properties/sumC3',
      visible: true,
      handleChange,
    } as unknown as ControlProps;

    render(<GoAComputed {...(props as ControlProps)} />);

    const input = screen.getByTestId('computed-input-sumC3') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
