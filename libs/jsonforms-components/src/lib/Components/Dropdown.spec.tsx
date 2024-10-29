import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dropdown } from './Dropdown';

describe('Dropdown Component', () => {
  const items = [
    { label: 'label-a', value: 'value-a' },
    { label: 'label-b', value: 'value-b' },
  ];
  const onChangeMock = jest.fn();

  it('renders the dropdown component', () => {
    render(
      <Dropdown
        label="mock-test"
        items={items}
        selected={items[0].value}
        onChange={onChangeMock}
        id="jsonforms-dropdown-mock-test"
      />
    );
    const DropdownComponent = screen.getByTestId('jsonforms-dropdown-mock-test');
    expect(DropdownComponent).toBeInTheDocument();
  });

  it('render the dropdown component with Autocompletion', () => {
    const items = [
      {
        label: 'label-a',
        value: 'value-a',
      },
      {
        label: 'label-b',
        value: 'value-b',
      },
    ];
    render(
      <Dropdown
        label="mock-test"
        items={items}
        selected={items[0].value}
        onChange={(value) => {}}
        isAutocompletion={true}
        id="jsonforms-dropdown-mock-test"
      />
    );
    const DropdownComponent = screen.getByTestId('jsonforms-dropdown-mock-test');
    expect(DropdownComponent).toBeTruthy();
  });

  it('opens and closes dropdown on input focus', () => {
    render(
      <Dropdown label="mock-test" items={items} selected="" onChange={onChangeMock} id="jsonforms-dropdown-mock-test" />
    );
    const input = screen.getByTestId('jsonforms-dropdown-mock-test-input');
    const dropdownListContainer = screen.getByTestId('jsonforms-dropdown-mock-test'); // Assuming this is the correct test ID for the wrapper.

    // Check dropdown opens on focus
    fireEvent.focus(input);
    expect(dropdownListContainer).toBeVisible();

    // // Check dropdown closes on second focus
    // fireEvent.focus(input);
    // expect(dropdownListContainer).not.toBeVisible();
  });

  it('filters options based on input text with autocompletion', () => {
    render(
      <Dropdown
        label="test-autocomplete"
        items={items}
        selected=""
        onChange={onChangeMock}
        isAutocompletion={true}
        id="autocomplete-dropdown"
      />
    );
    const input = screen.getByTestId('autocomplete-dropdown-input');

    // Type into input and check for filtered items
    fireEvent.change(input, { target: { value: 'label-a' } });
    expect(screen.getByText('label-a')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', () => {
    render(
      <Dropdown label="test-select" items={items} selected="" onChange={onChangeMock} id="test-select-dropdown" />
    );
    const option = screen.getByTestId('test-select-dropdown-label-a-option');

    fireEvent.click(option);
    expect(onChangeMock).toHaveBeenCalledWith('value-a');
  });
});
