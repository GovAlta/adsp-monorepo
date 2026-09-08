import { fireEvent, render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { GoAInputTextProps, GoAInputText } from './InputTextControl';
import { ControlElement, ControlProps, JsonSchema7 } from '@jsonforms/core';
import { DEFAULT_PATTERNS, formatWithPattern, filterAllowedKeys } from '../../util/patternForm';

import { validateSinWithLuhn, checkFieldValidity, isValidDate } from '../../util/stringUtils';
import { JsonFormsContext } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { fetchRegisterConfigFromOptions } from './InputTextControl';
import { JsonFormsRegisterContext } from '../../Context/register';

const mockContextValue = {
  errors: [],
  data: {},
};

//eslint-disable-next-line
const TestComponent: React.FC<{ props: any }> = ({ props }) => {
  return <>{checkFieldValidity(props)}</>;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Input Text Control tests', () => {
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/firstName',
    label: 'My First name',
    options: {
      autoCapitalize: false,
    },
  };

  const staticProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {},
    rootSchema: {
      if: {},
      then: {
        required: ['firstName'],
      },
    },
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: 'firstName',
    errors: '',
    data: 'My Name',
    visible: true,
    isValid: true,
    required: false,
    isVisited: false,
    setIsVisited: () => {},
  };

  const sinProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {
      title: 'Social insurance number',
      errorMessage: 'Must be three groups of three digits.',
      default: '123456789',
    },
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: '',
    errors: '',
    data: '1324567',
    visible: true,
    isValid: true,
    required: false,
  };
  const invalidSinProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: { title: 'Social insurance number', errorMessage: 'Please enter valid SIN' },
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: '',
    errors: '',
    data: '132 456 789',
    visible: true,
    isValid: true,
    required: false,
  };

  it('renders placeholder from componentProps', () => {
    const props = {
      ...staticProps,
      data: '',
      uischema: {
        ...staticProps.uischema,
        options: {
          ...staticProps.uischema.options,
          componentProps: {
            placeholder: 'Enter your first name',
          },
        },
      },
    };
    const { baseElement } = render(
      <JsonFormsContext.Provider value={mockContextValue}>
        <GoAInputText {...props} />
      </JsonFormsContext.Provider>,
    );
    const input = baseElement.querySelector("goa-input[testId='firstName-input']");

    expect(input).toHaveAttribute('placeholder', 'Enter your first name');
  });
  const emptyBooleanProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: { type: 'boolean' },
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: '',
    errors: '',
    data: null,
    visible: true,
    isValid: true,
    required: true,
  };

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('can create control', () => {
    it('can create control', () => {
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...staticProps} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      expect(firstNameInput).toBeInTheDocument();
    });

    it('can create control with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      expect(firstNameInput!.getAttribute('error')).toBe('true');
    });

    it('can create control with label as name', () => {
      const props = { ...staticProps, id: '', label: 'mytestInput' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='-input']");
      expect(firstNameInput!.getAttribute('name')).toBe('mytestInput-input');
    });

    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(<GoAInputBaseControl {...props} input={GoAInputText} />);
      expect(baseControl).toBeDefined();
    });
  });

  describe('text control events', () => {
    it('calls onBlur for input text control', () => {
      const props = {
        ...staticProps,
        uischema: {
          ...staticProps.uischema,
          options: {
            ...staticProps.uischema.options,
            autoCapitalize: true,
          },
        },
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const input = baseElement.querySelector("goa-input[testId='firstName-input']");
      const blurred = fireEvent.blur(input!);

      expect(blurred).toBe(true);
    });

    it('calls onChange for input text control', () => {
      const props = {
        ...staticProps,
        uischema: {
          ...staticProps.uischema,
          options: {
            ...staticProps.uischema.options,
            autoCapitalize: true,
          },
        },
      };

      const { baseElement, ...component } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const input = baseElement.querySelector("goa-input[testId='firstName-input']");

      fireEvent(
        input!,
        new CustomEvent('_change', {
          detail: { name: 'firstName', value: 'test' },
        }),
      );
      input!.setAttribute('value', 'test');
      expect(input?.getAttribute('value')).toBe('test');
    });

    it('can trigger keyPress event', async () => {
      const props = { ...staticProps };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      const pressed = fireEvent.keyPress(firstNameInput!, { key: 'z', code: 90, charCode: 90 });
      expect(pressed).toBe(true);
      expect(firstNameInput).toBeInTheDocument();
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      const blurred = fireEvent.blur(firstNameInput!);
      expect(blurred).toBe(true);
    });

    it('formats the value on blur when formatPattern is provided', () => {
      const handleChange = jest.fn();
      const props = {
        ...staticProps,
        data: '',
        path: 'phone',
        id: 'phone',
        handleChange,
        uischema: {
          type: 'Control',
          scope: '#/properties/phone',
          options: { formatPattern: '(###) ###-####' },
        } as ControlElement,
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const input = baseElement.querySelector("goa-input[testId='phone-input']");

      fireEvent(input!, new CustomEvent('_blur', { detail: { name: 'phone', value: '7801234567' } }));

      expect(handleChange).toHaveBeenCalledWith('phone', '(780) 123-4567');
    });

    it('does not reformat on blur when formatPattern is absent', () => {
      const handleChange = jest.fn();
      const props = {
        ...staticProps,
        data: '',
        path: 'phone',
        id: 'phone',
        required: false,
        handleChange,
        uischema: {
          type: 'Control',
          scope: '#/properties/phone',
        } as ControlElement,
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const input = baseElement.querySelector("goa-input[testId='phone-input']");

      fireEvent(input!, new CustomEvent('_blur', { detail: { name: 'phone', value: '7801234567' } }));

      expect(handleChange).not.toHaveBeenCalledWith('phone', '(780) 123-4567');
    });

    it('should format sin', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      await fireEvent(
        firstNameInput!,
        new CustomEvent('_change', {
          detail: { value: '123456789' },
        }),
      );

      // Wait for debounce (300ms)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(handleChangeMock).toHaveBeenCalledWith('', '123 456 789');
    });

    it('does not update SIN input when alphabet characters are entered', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      handleChangeMock.mockClear();
      (firstNameInput as HTMLElement & { value: string }).value = '123a';

      await fireEvent(
        firstNameInput!,
        new CustomEvent('_change', {
          detail: { value: '123a' },
        }),
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(handleChangeMock).not.toHaveBeenCalledWith('', expect.stringContaining('a'));
      expect((firstNameInput as HTMLElement & { value: string }).value).toBe('123');
    });

    it('prevents alphabet key presses for SIN input', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      const keyPressEvent = new CustomEvent('_keyPress', {
        cancelable: true,
        detail: { key: 'a', value: '123a' },
      });
      const preventDefaultSpy = jest.spyOn(keyPressEvent, 'preventDefault');

      fireEvent(firstNameInput!, keyPressEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('allows number and hyphen key presses for SIN input', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      const numberKeyDownEvent = new KeyboardEvent('keydown', {
        cancelable: true,
        bubbles: true,
        key: '1',
      });
      const hyphenKeyDownEvent = new KeyboardEvent('keydown', {
        cancelable: true,
        bubbles: true,
        key: '-',
      });
      const numberPreventDefaultSpy = jest.spyOn(numberKeyDownEvent, 'preventDefault');
      const hyphenPreventDefaultSpy = jest.spyOn(hyphenKeyDownEvent, 'preventDefault');

      fireEvent(firstNameInput!, numberKeyDownEvent);
      fireEvent(firstNameInput!, hyphenKeyDownEvent);

      expect(numberPreventDefaultSpy).not.toHaveBeenCalled();
      expect(hyphenPreventDefaultSpy).not.toHaveBeenCalled();
    });

    it('allows control and shortcut key presses for SIN input', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      const backspaceEvent = new KeyboardEvent('keydown', {
        cancelable: true,
        bubbles: true,
        key: 'Backspace',
      });
      const copyShortcutEvent = new KeyboardEvent('keydown', {
        cancelable: true,
        bubbles: true,
        key: 'c',
        ctrlKey: true,
      });
      const backspacePreventDefaultSpy = jest.spyOn(backspaceEvent, 'preventDefault');
      const shortcutPreventDefaultSpy = jest.spyOn(copyShortcutEvent, 'preventDefault');

      fireEvent(firstNameInput!, backspaceEvent);
      fireEvent(firstNameInput!, copyShortcutEvent);

      expect(backspacePreventDefaultSpy).not.toHaveBeenCalled();
      expect(shortcutPreventDefaultSpy).not.toHaveBeenCalled();
    });

    it('does not block alphabet key presses for non-SIN input', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      const keyDownEvent = new KeyboardEvent('keydown', {
        cancelable: true,
        bubbles: true,
        key: 'a',
      });
      const preventDefaultSpy = jest.spyOn(keyDownEvent, 'preventDefault');

      fireEvent(firstNameInput!, keyDownEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('strips invalid characters entered into SIN input', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      handleChangeMock.mockClear();
      (firstNameInput as HTMLElement & { value: string }).value = '123a456';

      await fireEvent(
        firstNameInput!,
        new CustomEvent('_change', {
          detail: { value: '123a456' },
        }),
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(handleChangeMock).not.toHaveBeenCalledWith('', expect.stringContaining('a'));
      expect((firstNameInput as HTMLElement & { value: string }).value).toBe('123 456');
    });

    it('allows valid pasted text for SIN input', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      const pasteEvent = new Event('paste', { cancelable: true, bubbles: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          getData: () => '123-456',
        },
      });
      const preventDefaultSpy = jest.spyOn(pasteEvent, 'preventDefault');

      fireEvent(firstNameInput!, pasteEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('prevents invalid GoA key press events for SIN input', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");
      const keyPressEvent = new CustomEvent('_keyPress', {
        cancelable: true,
        detail: { key: 'a', value: '1324567a' },
      });
      const preventDefaultSpy = jest.spyOn(keyPressEvent, 'preventDefault');

      fireEvent(firstNameInput!, keyPressEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not trigger handleChange event if nothing changes', async () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      const pressed = fireEvent.keyPress(firstNameInput!, { key: 'z', code: 90, charCode: 90 });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });
  });

  describe('Control Types test', () => {
    it('Empty Boolean control should show error', () => {
      const { getByText } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <TestComponent props={emptyBooleanProps} />
        </JsonFormsContext.Provider>,
      );

      expect(getByText('My First name is required')).toBeTruthy();
    });

    it('uses sentence case for auto-generated validation labels', () => {
      const autoGeneratedProps = {
        ...emptyBooleanProps,
        uischema: {
          type: 'Control' as const,
          scope: '#/properties/employmentStatus',
          options: {
            autoCapitalize: false,
          },
        },
        label: 'employmentStatus',
      };

      const { getByText } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <TestComponent props={autoGeneratedProps} />
        </JsonFormsContext.Provider>,
      );

      expect(getByText('Employment status is required')).toBeTruthy();
    });

    it('preserves acronym validation labels', () => {
      const acronymProps = {
        ...emptyBooleanProps,
        uischema: {
          type: 'Control' as const,
          scope: '#/properties/SIN',
        },
        label: 'SIN',
      };

      const { getByText } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <TestComponent props={acronymProps} />
        </JsonFormsContext.Provider>,
      );

      expect(getByText('SIN is required')).toBeTruthy();
    });

    it('Check if the date is a valid date/time', () => {
      const date = new Date();
      expect(isValidDate(date)).toBe(true);
    });
    it('Check the date is a invalid', () => {
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('Luhn validation function tests', () => {
    it('does not show an error for a valid schema-formatted SIN', () => {
      const validSinProps = {
        ...sinProps,
        schema: { ...sinProps.schema, default: undefined },
        data: '046 454 286',
      };

      const { container } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <TestComponent props={validSinProps} />
        </JsonFormsContext.Provider>,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should return true for valid SIN Number', () => {
      expect(validateSinWithLuhn('046454286')).toBe(true);
    });

    it('should return false for invalid SIN Number', () => {
      expect(validateSinWithLuhn('123456879')).toBe(false);
    });
    it('should return 9 digits for invalid SIN Number with more than 16 digits', () => {
      expect(formatWithPattern('123456879123456789999', DEFAULT_PATTERNS.sin.mask)).toBe('123 456 879');
    });
  });

  describe('SIN masking', () => {
    const sinMask = DEFAULT_PATTERNS.sin.mask;

    it('formats a valid SIN number with spaces', () => {
      expect(formatWithPattern('123456789', sinMask)).toBe('123 456 789');
    });

    it('re-formats an already formatted value', () => {
      expect(formatWithPattern('123 456 789', sinMask)).toBe('123 456 789');
    });

    it('truncates input longer than 9 digits', () => {
      expect(formatWithPattern('123456789012345', sinMask)).toBe('123 456 789');
    });

    it('formats input with fewer than 9 digits', () => {
      expect(formatWithPattern('12345', sinMask)).toBe('123 45');
    });

    it('returns an empty string for empty input', () => {
      expect(formatWithPattern('', sinMask)).toBe('');
    });

    it('strips non-digit characters via allowedKeys', () => {
      expect(filterAllowedKeys('abc123456def', DEFAULT_PATTERNS.sin.allowedKeys)).toBe('123456');
    });
  });

  describe('InputTextControl additional coverage', () => {
    it('fetchRegisterConfigFromOptions returns undefined when no url or urn', () => {
      const result = fetchRegisterConfigFromOptions({});
      expect(result).toBeUndefined();
    });

    it('fetchRegisterConfigFromOptions returns config when options exist', () => {
      const options = { url: 'https://example.com', someProp: 'value' };
      const result = fetchRegisterConfigFromOptions(options);
      expect(result).toEqual(options);
    });

    it('renders register string data as dropdown options', () => {
      const handleChangeMock = jest.fn();
      const fetchRegisterByUrlMock = jest.fn();
      const props = {
        ...staticProps,
        handleChange: handleChangeMock,
        uischema: {
          ...staticProps.uischema,
          options: {
            ...staticProps.uischema.options,
            register: { url: 'https://example.com/register' },
          },
        },
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <JsonFormsRegisterContext.Provider
            value={
              {
                isProvided: true,
                registerDispatch: jest.fn(),
                selectRegisterData: jest.fn(() => ['Option 1']),
                fetchErrors: jest.fn(() => ''),
                fetchRegisterByUrl: fetchRegisterByUrlMock,
              } as never
            }
          >
            <GoAInputText {...props} />
          </JsonFormsRegisterContext.Provider>
        </JsonFormsContext.Provider>,
      );

      const dropdown = baseElement.querySelector("goa-dropdown[testId='jsonforms-firstName-dropdown']");
      const option = baseElement.querySelector('goa-dropdown-item[value="Option 1"]');

      expect(dropdown).toBeInTheDocument();
      expect(option).toBeInTheDocument();
      expect(fetchRegisterByUrlMock).toHaveBeenCalledWith({ url: 'https://example.com/register' });

      fireEvent(
        dropdown!,
        new CustomEvent('_change', {
          detail: { value: 'Option 1' },
        }),
      );

      expect(handleChangeMock).toHaveBeenCalledWith('firstName', 'Option 1');
    });

    it('renders register object data using configured label and value paths', () => {
      const props = {
        ...staticProps,
        uischema: {
          ...staticProps.uischema,
          options: {
            ...staticProps.uischema.options,
            label: 'name',
            value: 'code',
            register: { urn: 'urn:ads:test:register' },
          },
        },
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <JsonFormsRegisterContext.Provider
            value={
              {
                isProvided: true,
                registerDispatch: jest.fn(),
                selectRegisterData: jest.fn(() => [{ name: 'Display label', code: 'display-value' }]),
                fetchErrors: jest.fn(() => ''),
                fetchRegisterByUrl: jest.fn(),
              } as never
            }
          >
            <GoAInputText {...props} />
          </JsonFormsRegisterContext.Provider>
        </JsonFormsContext.Provider>,
      );

      const option = baseElement.querySelector('goa-dropdown-item[value="display-value"]');

      expect(option).toBeInTheDocument();
      expect(option?.getAttribute('label')).toBe('Display label');
    });

    it('sets default value only when data is undefined', () => {
      const handleChangeMock = jest.fn();
      const props = {
        ...staticProps,
        data: undefined,
        schema: { type: 'string', default: 'Default User' },
        handleChange: handleChangeMock,
      };

      render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );

      expect(handleChangeMock).toHaveBeenCalledWith('firstName', 'Default User');
    });

    it('does not replace existing draft data with schema default', () => {
      const handleChangeMock = jest.fn();
      const props = {
        ...staticProps,
        data: 'Saved User',
        schema: { type: 'string', default: 'Default User' },
        handleChange: handleChangeMock,
      };

      render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );

      expect(handleChangeMock).not.toHaveBeenCalledWith('firstName', 'Default User');
    });

    it('does not reapply default after the user clears the field', () => {
      const handleChangeMock = jest.fn();
      const props = {
        ...staticProps,
        data: '',
        schema: { type: 'string', default: 'Default User' },
        handleChange: handleChangeMock,
      };

      render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );

      expect(handleChangeMock).not.toHaveBeenCalled();
    });

    it('does not apply changed schema default over existing data during rerender', () => {
      const handleChangeMock = jest.fn();
      const props = {
        ...staticProps,
        data: 'Saved User',
        schema: { type: 'string', default: 'Default User' },
        handleChange: handleChangeMock,
      };

      const { rerender } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );

      rerender(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} schema={{ type: 'string', default: 'Changed Default' }} />
        </JsonFormsContext.Provider>,
      );

      expect(handleChangeMock).not.toHaveBeenCalled();
    });
  });

  it('does not auto-populate an empty field in the control', () => {
    const handleChangeMock = jest.fn();

    const props = {
      ...staticProps,
      data: undefined,
      handleChange: handleChangeMock,
      uischema: {
        ...staticProps.uischema,
        options: {
          ...staticProps.uischema.options,
          autoPopulate: 'firstName',
        },
      },
    };

    render(
      <JsonFormsContext.Provider value={mockContextValue}>
        <GoAInputText {...props} />
      </JsonFormsContext.Provider>,
    );

    expect(handleChangeMock).not.toHaveBeenCalled();
  });

  it('does not infer auto-population from the field name', () => {
    const handleChangeMock = jest.fn();

    render(
      <JsonFormsContext.Provider value={mockContextValue}>
        <GoAInputText {...staticProps} data={undefined} handleChange={handleChangeMock} />
      </JsonFormsContext.Provider>,
    );

    expect(handleChangeMock).not.toHaveBeenCalled();
  });

  describe('schema format masks', () => {
    const renderInput = (props: GoAInputTextProps & ControlProps) =>
      render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>,
      );

    it('formats a postal code from schema format postalCode', async () => {
      const handleChange = jest.fn();
      const props = {
        ...staticProps,
        data: '',
        path: 'postalCode',
        id: 'postalCode',
        handleChange,
        schema: { type: 'string', format: 'postalCode' },
        uischema: { type: 'Control', scope: '#/properties/postalCode' } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='postalCode-input']");

      fireEvent(input!, new CustomEvent('_change', { detail: { value: 'T2P1A1' } }));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(handleChange).toHaveBeenCalledWith('postalCode', 'T2P 1A1');
    });

    it('formats a motor vehicle ID from schema format mvid', async () => {
      const handleChange = jest.fn();
      const props = {
        ...staticProps,
        data: '',
        path: 'mvid',
        id: 'mvid',
        handleChange,
        schema: { type: 'string', format: 'mvid' },
        uischema: { type: 'Control', scope: '#/properties/mvid' } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='mvid-input']");

      fireEvent(input!, new CustomEvent('_change', { detail: { value: '123456789' } }));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(handleChange).toHaveBeenCalledWith('mvid', '1234-56789');
    });

    it('formats a driver licence from schema format driverId', async () => {
      const handleChange = jest.fn();
      const props = {
        ...staticProps,
        data: '',
        path: 'driverId',
        id: 'driverId',
        handleChange,
        schema: { type: 'string', format: 'driverId' },
        uischema: { type: 'Control', scope: '#/properties/driverId' } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='driverId-input']");

      fireEvent(input!, new CustomEvent('_change', { detail: { value: '123456789' } }));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(handleChange).toHaveBeenCalledWith('driverId', '123456-789');
    });

    it('formats a SIN from schema format sin', async () => {
      const handleChange = jest.fn();
      const props = {
        ...sinProps,
        data: '',
        path: 'sin',
        id: 'sin',
        handleChange,
        schema: { type: 'string', format: 'sin' },
        uischema: { type: 'Control', scope: '#/properties/sin' } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='sin-input']");

      fireEvent(input!, new CustomEvent('_change', { detail: { value: '123456789' } }));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(handleChange).toHaveBeenCalledWith('sin', '123 456 789');
    });

    it('uses a custom mask from UI schema options', async () => {
      const handleChange = jest.fn();
      const props = {
        ...staticProps,
        data: '',
        path: 'customMask',
        id: 'customMask',
        handleChange,
        schema: { type: 'string' },
        uischema: {
          type: 'Control',
          scope: '#/properties/customMask',
          options: { mask: '####-##' },
        } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='customMask-input']");

      fireEvent(input!, new CustomEvent('_change', { detail: { value: '123456' } }));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      expect(handleChange).toHaveBeenCalledWith('customMask', '1234-56');
    });

    it('shows the in-place template for a driver licence', () => {
      const props = {
        ...staticProps,
        data: '',
        path: 'driverId',
        id: 'driverId',
        schema: { type: 'string', format: 'driverId' },
        uischema: {
          type: 'Control',
          scope: '#/properties/driverId',
          options: { inPlace: true },
        } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='driverId-input']");

      expect(input).toHaveAttribute('value', DEFAULT_PATTERNS.driverId.mask);
    });

    it('does not apply a mask for an unknown schema format', () => {
      const props = {
        ...staticProps,
        data: 'plain text',
        path: 'notes',
        id: 'notes',
        schema: { type: 'string', format: 'unknown-format' },
        uischema: { type: 'Control', scope: '#/properties/notes' } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='notes-input']");

      expect(input).toHaveAttribute('value', 'plain text');
    });

    it('blocks extra content keys when an in-place mask is full', () => {
      const props = {
        ...staticProps,
        data: '123456-789',
        path: 'driverId',
        id: 'driverId',
        schema: { type: 'string', format: 'driverId' },
        uischema: {
          type: 'Control',
          scope: '#/properties/driverId',
          options: { inPlace: true },
        } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='driverId-input']");
      const keyPressEvent = new CustomEvent('_keyPress', {
        cancelable: true,
        detail: { key: '1', value: '123456-7891' },
      });
      const preventDefaultSpy = jest.spyOn(keyPressEvent, 'preventDefault');

      fireEvent(input!, keyPressEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('uses the mask placeholder when a format is detected', () => {
      const props = {
        ...staticProps,
        data: '',
        path: 'postalCode',
        id: 'postalCode',
        schema: { type: 'string', format: 'postalCode' },
        uischema: { type: 'Control', scope: '#/properties/postalCode' } as ControlElement,
      };

      const { baseElement } = renderInput(props);
      const input = baseElement.querySelector("goa-input[testId='postalCode-input']");

      expect(input).toHaveAttribute('placeholder', '000 000');
    });
  });
});
