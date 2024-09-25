import { render, screen } from '@testing-library/react';
import { Dropdown } from './Dropdown';

describe('Dropdown Component', () => {
  it('render the dropdown component', () => {
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
        id="jsonforms-dropdown-mock-test"
      />
    );
    const DropdownComponent = screen.getByTestId('jsonforms-dropdown-mock-test');
    expect(DropdownComponent).toBeTruthy();
  });
});
