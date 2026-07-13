import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrimitiveArrayControl } from './ObjectArray';

jest.mock('../../util', () => ({
  Visible: ({ $visible, children }: { $visible?: boolean; children: React.ReactNode }) =>
    $visible !== false ? <>{children}</> : null,
  getLabelText: (_scope: string, label: string) => label,
}));

jest.mock('@abgov/react-components-ds1', () => ({
  GoabButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  GoabIconButton: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
  GoabCheckbox: ({
    text,
    description,
    checked,
    disabled,
    testId,
    onChange,
    value,
    name,
  }: {
    text: string;
    description?: string;
    checked?: boolean;
    disabled?: boolean;
    testId?: string;
    value?: string;
    name?: string;
    onChange?: (detail: { name?: string; value?: boolean }) => void;
  }) => (
    <div data-testid={testId}>
      <span>{text}</span>
      {description && <span>{description}</span>}
      <span>{checked ? 'checked' : 'unchecked'}</span>
      <button type="button" disabled={disabled} onClick={() => onChange?.({ name, value: !checked })}>
        toggle-{value}
      </button>
    </div>
  ),
}));

describe('PrimitiveArrayControl - checkboxes format', () => {
  const baseProps = {
    data: [],
    path: 'testPath',
    handleChange: jest.fn(),
    visible: true,
    enabled: true,
    renderers: [],
    cells: [],
    id: 'test-id',
    label: 'Test label',
    errors: '',
    schema: {
      type: 'array',
      title: 'Fruits',
      items: {
        type: 'string',
        enum: ['apple', 'banana'],
      },
    },
    uischema: {
      type: 'Control',
      scope: '#/properties/fruits',
      label: 'Fruits',
      options: {
        format: 'checkboxes',
      },
    },
    rootSchema: {},
    config: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders checkboxes when options.format is checkboxes', () => {
    render(<PrimitiveArrayControl {...baseProps} />);

    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByTestId('apple-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('banana-checkbox')).toBeInTheDocument();
  });

  it('marks items as checked when they exist in data', () => {
    render(<PrimitiveArrayControl {...baseProps} data={['banana']} />);

    expect(screen.getByTestId('apple-checkbox')).toHaveTextContent('unchecked');
    expect(screen.getByTestId('banana-checkbox')).toHaveTextContent('checked');
  });

  it('adds a value when a checkbox is turned on', () => {
    const handleChange = jest.fn();

    render(<PrimitiveArrayControl {...baseProps} data={[]} handleChange={handleChange} />);

    fireEvent.click(screen.getByText('toggle-apple'));

    expect(handleChange).toHaveBeenCalledWith('testPath', ['apple']);
  });

  it('removes a value when a checkbox is turned off', () => {
    const handleChange = jest.fn();

    render(<PrimitiveArrayControl {...baseProps} data={['apple', 'banana']} handleChange={handleChange} />);

    fireEvent.click(screen.getByText('toggle-apple'));

    expect(handleChange).toHaveBeenCalledWith('testPath', ['banana']);
  });

  it('passes undefined when the last selected checkbox is turned off', () => {
    const handleChange = jest.fn();

    render(<PrimitiveArrayControl {...baseProps} data={['apple']} handleChange={handleChange} />);

    fireEvent.click(screen.getByText('toggle-apple'));

    expect(handleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('renders oneOf titles and descriptions when schema.items.oneOf is used', () => {
    render(
      <PrimitiveArrayControl
        {...baseProps}
        schema={{
          type: 'array',
          items: {
            oneOf: [
              { const: 'apple', title: 'Apple label', description: 'Apple description' },
              { const: 'banana', title: 'Banana label', description: 'Banana description' },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText('Apple label')).toBeInTheDocument();
    expect(screen.getByText('Apple description')).toBeInTheDocument();
    expect(screen.getByText('Banana label')).toBeInTheDocument();
    expect(screen.getByText('Banana description')).toBeInTheDocument();
  });

  it('disables checkbox interaction when enabled is false', () => {
    render(<PrimitiveArrayControl {...baseProps} enabled={false} />);

    expect(screen.getByText('toggle-apple')).toBeDisabled();
    expect(screen.getByText('toggle-banana')).toBeDisabled();
  });

  it('does not render when visible is false', () => {
    render(<PrimitiveArrayControl {...baseProps} visible={false} />);

    expect(screen.queryByTestId('apple-checkbox')).not.toBeInTheDocument();
    expect(screen.queryByTestId('banana-checkbox')).not.toBeInTheDocument();
  });
});
