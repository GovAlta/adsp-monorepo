import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NamespaceDropdown } from './NamespaceDropdown';

describe('NamespaceDropdown', () => {
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input field with provided value', () => {
    const { container } = render(
      <NamespaceDropdown value="test-namespace" onChange={mockOnChange} existingNamespaces={[]} />
    );

    const input = container.querySelector("goa-input[testId='namespace-dropdown']");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('value', 'test-namespace');
  });

  test('disables input when disabled prop is true', () => {
    const { container } = render(
      <NamespaceDropdown value="test" onChange={mockOnChange} disabled={true} existingNamespaces={[]} />
    );

    const input = container.querySelector("goa-input[testId='namespace-dropdown']");
    expect(input).toBeDisabled();
  });

  test('calls onChange when input value changes', () => {
    const { container } = render(<NamespaceDropdown value="" onChange={mockOnChange} existingNamespaces={[]} />);

    const input = container.querySelector("goa-input[testId='namespace-dropdown']");
    fireEvent.change(input, { detail: { value: 'new-value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new-value');
  });

  test('displays dropdown list when input is focused', async () => {
    const existingNamespaces = ['namespace-1', 'namespace-2', 'namespace-3'];

    render(<NamespaceDropdown value="" onChange={mockOnChange} existingNamespaces={existingNamespaces} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('namespace-1')).toBeInTheDocument();
      expect(screen.getByText('namespace-2')).toBeInTheDocument();
      expect(screen.getByText('namespace-3')).toBeInTheDocument();
    });
  });

  test('filters namespaces based on input value', async () => {
    const existingNamespaces = ['service-metrics', 'service-logs', 'task-service'];

    const { container } = render(
      <NamespaceDropdown value="service" onChange={mockOnChange} existingNamespaces={existingNamespaces} />
    );

    const input = container.querySelector("goa-input[testId='namespace-dropdown']");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('service-metrics')).toBeInTheDocument();
      expect(screen.getByText('service-logs')).toBeInTheDocument();
      expect(screen.queryByText('task-service')).toBeInTheDocument();
    });
  });

  test('closes dropdown when clicking outside', async () => {
    const existingNamespaces = ['namespace-1'];

    render(
      <div>
        <NamespaceDropdown value="" onChange={mockOnChange} existingNamespaces={existingNamespaces} />
        <button data-testid="outside-button">Outside</button>
      </div>
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('namespace-1')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByTestId('outside-button'));

    await waitFor(() => {
      expect(screen.queryByText('namespace-1')).not.toBeInTheDocument();
    });
  });

  test('calls onBlur when input loses focus', async () => {
    const { container } = render(
      <NamespaceDropdown value="test" onChange={mockOnChange} onBlur={mockOnBlur} existingNamespaces={[]} />
    );

    const input = container.querySelector("goa-input[testId='namespace-dropdown']");
    fireEvent.blur(input);

    await waitFor(
      () => {
        expect(mockOnBlur).toHaveBeenCalled();
      },
      { timeout: 300 }
    );
  });

  test('selects namespace from dropdown when clicked', async () => {
    const existingNamespaces = ['namespace-1', 'namespace-2'];

    render(<NamespaceDropdown value="" onChange={mockOnChange} existingNamespaces={existingNamespaces} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('namespace-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('namespace-1'));

    expect(mockOnChange).toHaveBeenCalledWith('namespace-1');
  });

  test('handles keyboard navigation with arrow keys', async () => {
    const existingNamespaces = ['namespace-1', 'namespace-2', 'namespace-3'];

    render(<NamespaceDropdown value="" onChange={mockOnChange} existingNamespaces={existingNamespaces} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('namespace-1')).toBeInTheDocument();
    });

    // Arrow down should highlight first item
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Enter should select highlighted item
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith('namespace-1');
  });

  test('closes dropdown on Escape key', async () => {
    const existingNamespaces = ['namespace-1'];

    render(<NamespaceDropdown value="" onChange={mockOnChange} existingNamespaces={existingNamespaces} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('namespace-1')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('namespace-1')).not.toBeInTheDocument();
    });
  });

  test('shows "no namespaces" message when no matching results', async () => {
    const existingNamespaces = ['namespace-1'];

    const { container } = render(
      <NamespaceDropdown value="xyz" onChange={mockOnChange} existingNamespaces={existingNamespaces} />
    );

    const input = container.querySelector("goa-input[testId='namespace-dropdown']");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText(/No existing namespaces match "xyz"/)).toBeInTheDocument();
    });
  });

  test('displays unique namespaces only', async () => {
    const existingNamespaces = ['namespace-1', 'namespace-1', 'namespace-2', 'namespace-2'];

    render(<NamespaceDropdown value="" onChange={mockOnChange} existingNamespaces={existingNamespaces} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      const items = screen.getAllByText(/namespace-/);
      expect(items).toHaveLength(2);
    });
  });

  test('sorts namespaces alphabetically', async () => {
    const existingNamespaces = ['zebra', 'apple', 'mango'];

    render(<NamespaceDropdown value="" onChange={mockOnChange} existingNamespaces={existingNamespaces} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      const items = screen.getAllByText(/apple|mango|zebra/);
      expect(items[0]).toHaveTextContent('apple');
      expect(items[1]).toHaveTextContent('mango');
      expect(items[2]).toHaveTextContent('zebra');
    });
  });

  test('uses custom testId when provided', () => {
    const { container } = render(
      <NamespaceDropdown value="test" onChange={mockOnChange} testId="custom-test-id" existingNamespaces={[]} />
    );

    const input = container.querySelector("goa-input[testId='custom-test-id']");
    expect(input).toBeInTheDocument();
  });

  test('does not show dropdown when disabled', async () => {
    const existingNamespaces = ['namespace-1'];

    render(
      <NamespaceDropdown value="" onChange={mockOnChange} disabled={true} existingNamespaces={existingNamespaces} />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.queryByText('namespace-1')).not.toBeInTheDocument();
    });
  });
});
