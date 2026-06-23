import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NamespaceDropdown } from './NamespaceDropdown';

describe('NamespaceDropdown', () => {
  const existingNamespaces = ['another', 'test'];

  it('does not open the namespace list on initial focus', async () => {
    const { baseElement } = render(
      <NamespaceDropdown value="" onChange={() => {}} existingNamespaces={existingNamespaces} testId="form-namespace" />
    );

    const combobox = screen.getByRole('combobox', { name: 'Namespace' });
    const input = baseElement.querySelector("goa-input[testId='form-namespace']");
    expect(input).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await waitFor(() => {
      fireEvent.focus(input as Element);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('opens the namespace list when the user clicks the namespace field', async () => {
    const { baseElement } = render(
      <NamespaceDropdown value="" onChange={() => {}} existingNamespaces={existingNamespaces} testId="form-namespace" />
    );

    const combobox = screen.getByRole('combobox', { name: 'Namespace' });
    const input = baseElement.querySelector("goa-input[testId='form-namespace']");
    fireEvent.mouseDown(input as Element);

    expect(await screen.findByRole('listbox', { name: 'Namespace options' })).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'another' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'test' })).toBeInTheDocument();
  });

  it('opens from the keyboard and exposes the highlighted option', async () => {
    render(<NamespaceDropdown value="" onChange={() => {}} existingNamespaces={existingNamespaces} testId="form-namespace" />);

    const combobox = screen.getByRole('combobox', { name: 'Namespace' });
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });

    const listbox = await screen.findByRole('listbox', { name: 'Namespace options' });
    const firstOption = screen.getByRole('option', { name: 'another' });

    expect(listbox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-activedescendant', firstOption.id);
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps search and selection working', async () => {
    const onChange = jest.fn();
    const { baseElement } = render(
      <NamespaceDropdown value="" onChange={onChange} existingNamespaces={existingNamespaces} testId="form-namespace" />
    );

    const input = baseElement.querySelector("goa-input[testId='form-namespace']");
    fireEvent(input as Element, new CustomEvent('_change', { detail: { value: 'tes' } }));

    expect(onChange).toHaveBeenCalledWith('tes');
    expect(await screen.findByText('test')).toBeInTheDocument();
    expect(screen.queryByText('another')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('test'));
    expect(onChange).toHaveBeenCalledWith('test');
  });
});
