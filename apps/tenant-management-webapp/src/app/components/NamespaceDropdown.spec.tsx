import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NamespaceDropdown } from './NamespaceDropdown';

describe('NamespaceDropdown', () => {
  const existingNamespaces = ['test', 'another', 'core'];

  it('does not open the namespace list on initial render or focus', () => {
    const { baseElement } = render(
      <NamespaceDropdown
        value=""
        onChange={jest.fn()}
        existingNamespaces={existingNamespaces}
        testId="form-namespace"
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Namespace' });
    const input = baseElement.querySelector("goa-input[testId='form-namespace']");

    expect(input).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.focus(input as Element);

    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the namespace list when the user clicks the field', async () => {
    const { baseElement } = render(
      <NamespaceDropdown
        value=""
        onChange={jest.fn()}
        existingNamespaces={existingNamespaces}
        testId="form-namespace"
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Namespace' });
    const input = baseElement.querySelector("goa-input[testId='form-namespace']");

    fireEvent.mouseDown(input as Element);

    expect(await screen.findByRole('listbox', { name: 'Namespace options' })).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'another' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'core' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'test' })).toBeInTheDocument();
  });

  it('opens from the keyboard', async () => {
    render(
      <NamespaceDropdown
        value=""
        onChange={jest.fn()}
        existingNamespaces={existingNamespaces}
        testId="form-namespace"
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Namespace' });

    fireEvent.keyDown(combobox, { key: 'ArrowDown' });

    expect(await screen.findByRole('option', { name: 'another' })).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps search and selection working for existing namespaces', async () => {
    const onChange = jest.fn();
    const { baseElement, rerender } = render(
      <NamespaceDropdown
        value=""
        onChange={onChange}
        existingNamespaces={existingNamespaces}
        testId="form-namespace"
      />
    );
    const input = baseElement.querySelector("goa-input[testId='form-namespace']");

    fireEvent(
      input as Element,
      new CustomEvent('_change', {
        detail: { value: 'te' },
      })
    );

    expect(onChange).toHaveBeenCalledWith('te');

    rerender(
      <NamespaceDropdown
        value="te"
        onChange={onChange}
        existingNamespaces={existingNamespaces}
        testId="form-namespace"
      />
    );

    expect(await screen.findByRole('option', { name: 'test' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'another' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'test' }));

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('does not open when disabled', () => {
    const { baseElement } = render(
      <NamespaceDropdown
        value=""
        onChange={jest.fn()}
        disabled
        existingNamespaces={existingNamespaces}
        testId="form-namespace"
      />
    );
    const input = baseElement.querySelector("goa-input[testId='form-namespace']");

    fireEvent.mouseDown(input as Element);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
