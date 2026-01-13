import { fireEvent, render, screen } from '@testing-library/react';
import { Dropdown, isValidKey } from './Dropdown';

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
        enabled={true}
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
        enabled={true}
        label="mock-test"
        items={items}
        selected={items[0].value}
        onChange={(value) => {}}
        isAutoCompletion={true}
        id="jsonforms-dropdown-mock-test"
      />
    );
    const DropdownComponent = screen.getByTestId('jsonforms-dropdown-mock-test');
    expect(DropdownComponent).toBeTruthy();
  });
  describe('key presses tests', () => {
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
    it('can trigger enter/tab/ecape keys', () => {
      const { baseElement, ...component } = render(
        <Dropdown
          enabled={true}
          label="mock-test"
          items={items}
          selected={items[0].value}
          onChange={(value) => {}}
          isAutoCompletion={true}
          id="jsonforms-dropdown-mock-test"
        />
      );
      const input = baseElement.querySelector("goa-input[testId='jsonforms-dropdown-mock-test-input']");

      input.focus();
      const dd = component.getAllByTestId('jsonforms-dropdown-mock-test-label-a-option')[0];

      fireEvent.keyDown(dd, {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        charCode: 40,
      });
      fireEvent.keyDown(dd, {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        charCode: 27,
      });

      fireEvent.keyDown(dd, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        charCode: 13,
      });

      fireEvent.keyDown(dd, {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        charCode: 40,
      });
      expect(dd.innerHTML).toContain('label-a');
    });
  });
  describe('tests for auto complete', () => {
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
    it('can trigger up/down arrow keys', () => {
      const { baseElement, ...component } = render(
        <Dropdown
          enabled={true}
          label="mock-test"
          items={items}
          selected={items[0].value}
          onChange={(value) => {}}
          isAutoCompletion={true}
          id="jsonforms-dropdown-mock-test"
        />
      );
      const input = baseElement.querySelector("goa-input[testId='jsonforms-dropdown-mock-test-input']");
      input.focus();
      const dd = component.getAllByTestId('jsonforms-dropdown-mock-test-label-a-option')[0];

      fireEvent.keyDown(dd, {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        charCode: 40,
      });
      fireEvent.keyDown(dd, {
        key: 'ArrowUp',
        code: 'ArrowUp',
        keyCode: 38,
        charCode: 38,
      });
      fireEvent.keyDown(dd, {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        charCode: 40,
      });

      fireEvent.keyDown(dd, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        charCode: 13,
      });

      fireEvent.keyDown(dd, {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        charCode: 9,
      });
      expect(dd.innerHTML).toContain('label-a');
    });

    it('keypress can trigger a value', () => {
      const items = [
        {
          label: ' ',
          value: ' ',
        },
        {
          label: 'label-a',
          value: 'value-a',
        },
        {
          label: 'label-b',
          value: 'value-b',
        },
      ];
      const component = render(
        <Dropdown
          enabled={true}
          label="mock-test"
          items={items}
          selected={items[0].value}
          onChange={(value) => {}}
          isAutoCompletion={true}
          id="jsonforms-dropdown-mock-test"
        />
      );

      const dd = component.getAllByTestId('jsonforms-dropdown-mock-test-label-b-option')[0];
      dd.focus();

      fireEvent.keyDown(dd, {
        key: 'ArrowUp',
        code: 'ArrowUp',
        keyCode: 38,
        charCode: 38,
      });

      expect(dd.innerHTML).toContain('label-b');
    });

    it('can trigger up with no value', () => {
      const items = [
        {
          label: ' ',
          value: ' ',
        },
        {
          label: 'label-a',
          value: 'value-a',
        },
        {
          label: 'label-b',
          value: 'value-b',
        },
      ];
      const component = render(
        <Dropdown
          enabled={true}
          label="mock-test"
          items={items}
          selected={items[0].value}
          onChange={(value) => {}}
          isAutoCompletion={true}
          id="jsonforms-dropdown-mock-test"
        />
      );

      const dd = component.getAllByTestId('jsonforms-dropdown-mock-test- -option')[0];
      dd.focus();

      fireEvent.keyDown(dd, {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        charCode: 40,
      });

      expect(dd.innerHTML).toContain(' ');
    });

    it('can press enter key for search', () => {
      const { baseElement } = render(
        <Dropdown
          enabled={true}
          label="mock-test"
          items={items}
          selected={items[0].value}
          onChange={(value) => {}}
          isAutoCompletion={true}
          id="jsonforms-dropdown-mock-test"
        />
      );

      const input = baseElement.querySelector("goa-input[testId='jsonforms-dropdown-mock-test-input']");

      input.focus();

      fireEvent.keyDown(
        input,
        new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          code: 'ArrowDown',
          keyCode: 40,
          charCode: 40,
        })
      );
      fireEvent.keyDown(
        input,
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          charCode: 13,
        })
      );
      fireEvent(input, new CustomEvent('_change', { detail: { name: 'label-a', value: 'value-a' } }));
      expect(input.getAttribute('value')).toContain('value-a');
    });
  });
  describe('test util functions', () => {
    it('test isValidKey is true with letter character', () => {
      expect(isValidKey('a')).toBe(true);
    });
    it('test isValidKey is true if it is a number', () => {
      expect(isValidKey('1')).toBe(true);
    });

    it('test isValidKey is false if it is not a shift key', () => {
      expect(isValidKey('Shift')).toBe(false);
    });
    it('test isValidKey is false for non-matching character (space)', () => {
      expect(isValidKey(' ')).toBe(false);
    });
  });

  it('handles ArrowDown when getElementById returns null (non-autoCompletion fallback)', () => {
    const items = [
      { label: 'label-a', value: 'value-a' },
      { label: 'label-b', value: 'value-b' },
    ];

    const origGetElementById = document.getElementById;
    const origQuery = document.querySelectorAll;

    // make getElementById return null to force fallback
    // and provide a fake NodeList for querySelectorAll
    // that mimics elements.item(0).children.item(1).innerText
    // (used by the non-autoCompletion branch)
    // @ts-expect-error -- override DOM for fallback branch in test
    document.getElementById = jest.fn().mockReturnValue(null);
    // @ts-expect-error -- override DOM for fallback branch in test
    document.querySelectorAll = jest
      .fn()
      .mockReturnValue({ item: () => ({ children: { item: () => ({ innerText: 'label-b' }) } }) });

    const { baseElement } = render(
      <Dropdown
        enabled={true}
        label="mock-test"
        items={items}
        selected={items[0].value}
        onChange={(value) => {}}
        isAutoCompletion={false}
        id="jsonforms-dropdown-mock-test"
      />
    );

    const input = baseElement.querySelector("goa-input[testId='jsonforms-dropdown-mock-test-input']");
    input.focus();

    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, charCode: 40 });

    // restore
    document.getElementById = origGetElementById;
    document.querySelectorAll = origQuery;
  });

  it('handles ArrowDown when getElementById returns null (autoCompletion fallback)', () => {
    const items = [
      { label: 'label-a', value: 'value-a' },
      { label: 'label-b', value: 'value-b' },
    ];

    const origGetElementById = document.getElementById;
    const origQuery = document.querySelectorAll;

    // force getElementById null and provide NodeList for autoCompletion branch
    // which uses elements[0].children[0]
    // @ts-expect-error -- override DOM for fallback branch in test
    document.getElementById = jest.fn().mockReturnValue(null);
    // @ts-expect-error -- override DOM for fallback branch in test
    document.querySelectorAll = jest.fn().mockReturnValue([{ children: [{ innerText: 'label-b' }] }]);

    const { baseElement } = render(
      <Dropdown
        enabled={true}
        label="mock-test"
        items={items}
        selected={items[0].value}
        onChange={(value) => {}}
        isAutoCompletion={true}
        id="jsonforms-dropdown-mock-test"
      />
    );

    const input = baseElement.querySelector("goa-input[testId='jsonforms-dropdown-mock-test-input']");
    input.focus();

    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, charCode: 40 });

    // restore
    document.getElementById = origGetElementById;
    document.querySelectorAll = origQuery;
  });
});
