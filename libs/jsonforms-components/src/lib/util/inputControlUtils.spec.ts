import {
  onChangeForCheckboxData,
  onChangeForNumericControl,
  onKeyPressForTextControl,
  onKeyPressNumericControl,
  onKeyPressForTimeControl,
  onKeyPressForDateControl,
  onBlurForTextControl,
  onBlurForNumericControl,
  onBlurForDateControl,
  onBlurForTimeControl,
  onChangeForInputControl,
  onChangeForDateControl,
  onChangeForDateTimeControl,
  isRequiredAndHasNoData,
  isNotKeyPressTabOrShift,
} from './inputControlUtils';
import { ControlProps } from '@jsonforms/core';

describe('onChangeForCheckboxData', () => {
  it('should add a checkbox value when data is an array with other values', () => {
    const data = ['Option2'];
    const name = 'Option1';
    const value = 'true';

    const result = onChangeForCheckboxData(data, name, value);
    expect(result).toEqual(['Option2', 'Option1']);
  });

  it('should remove a checkbox value when value is false', () => {
    const data = ['Option1', 'Option2'];
    const name = 'Option1';
    const value = '';

    const result = onChangeForCheckboxData(data, name, value);
    expect(result).toEqual(['Option2']);
  });

  it('should handle case when data is undefined and add a checkbox value', () => {
    const data = undefined;
    const name = 'Option1';
    const value = 'true';

    const result = onChangeForCheckboxData(data, name, value);
    expect(result).toEqual(['Option1']);
  });

  it('should handle case when data is null and add a checkbox value', () => {
    const data = null;
    const name = 'Option1';
    const value = 'true';

    const result = onChangeForCheckboxData(data, name, value);
    expect(result).toEqual(['Option1']);
  });

  it('should return same array if name is not found in data and value is false', () => {
    const data = ['Option2', 'Option3'];
    const name = 'Option1';
    const value = '';

    const result = onChangeForCheckboxData(data, name, value);
    expect(result).toEqual(['Option2', 'Option3']);
  });
});

describe('onChangeForNumericControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call handleChange with number when input is valid string number', () => {
    onChangeForNumericControl({
      value: '123',
      controlProps: baseControlProps as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 123);
  });

  it('should call handleChange with undefined when input is empty string', () => {
    onChangeForNumericControl({
      value: '',
      controlProps: baseControlProps as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should NOT call handleChange when value is same as data', () => {
    onChangeForNumericControl({
      value: '123',
      controlProps: { ...baseControlProps, data: 123 } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should call handleChange with 0 when value is 0 (number)', () => {
    onChangeForNumericControl({
      value: 0,
      controlProps: baseControlProps as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 0);
  });

  it('should call handleChange with null when value is null', () => {
    onChangeForNumericControl({
      value: null,
      controlProps: baseControlProps as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', null);
  });

  it('should handle negative numbers', () => {
    onChangeForNumericControl({
      value: '-50',
      controlProps: { ...baseControlProps, data: 100 } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', -50);
  });

  it('should handle decimal numbers', () => {
    onChangeForNumericControl({
      value: '123.45',
      controlProps: baseControlProps as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should call handleChange with undefined when value is empty string and data is different', () => {
    onChangeForNumericControl({
      value: '',
      controlProps: { ...baseControlProps, data: 100 } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should call handleChange with undefined when value is 0 string but data is null', () => {
    onChangeForNumericControl({
      value: '0',
      controlProps: { ...baseControlProps, data: null } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should not call handleChange when value equals data', () => {
    mockHandleChange.mockClear();
    onChangeForNumericControl({
      value: '100',
      controlProps: { ...baseControlProps, data: 100 } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should handle null value with non-null data', () => {
    mockHandleChange.mockClear();
    onChangeForNumericControl({
      value: null,
      controlProps: { ...baseControlProps, data: 50 } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', null);
  });
});

describe('isNotKeyPressTabOrShift', () => {
  it('should return true for non-Tab/Shift keys', () => {
    expect(isNotKeyPressTabOrShift('Enter')).toBe(true);
    expect(isNotKeyPressTabOrShift('a')).toBe(true);
    expect(isNotKeyPressTabOrShift(' ')).toBe(true);
    expect(isNotKeyPressTabOrShift('ArrowDown')).toBe(true);
  });

  it('should return false for Tab key', () => {
    expect(isNotKeyPressTabOrShift('Tab')).toBe(false);
  });

  it('should return false for Shift key', () => {
    expect(isNotKeyPressTabOrShift('Shift')).toBe(false);
  });
});

describe('isRequiredAndHasNoData', () => {
  const mockHandleChange = jest.fn();

  it('should return true when field is required and data is empty', () => {
    const props = {
      handleChange: mockHandleChange,
      path: 'testPath',
      required: true,
      data: '',
    } as unknown as ControlProps;
    expect(isRequiredAndHasNoData(props)).toBe(true);
  });

  it('should return true when field is required and data is undefined', () => {
    const props = {
      handleChange: mockHandleChange,
      path: 'testPath',
      required: true,
      data: undefined,
    } as unknown as ControlProps;
    expect(isRequiredAndHasNoData(props)).toBe(true);
  });

  it('should return false when field is required but has data', () => {
    const props = {
      handleChange: mockHandleChange,
      path: 'testPath',
      required: true,
      data: 'value',
    } as unknown as ControlProps;
    expect(isRequiredAndHasNoData(props)).toBe(false);
  });

  it('should return false when field is not required', () => {
    const props = {
      handleChange: mockHandleChange,
      path: 'testPath',
      required: false,
      data: '',
    } as unknown as ControlProps;
    expect(isRequiredAndHasNoData(props)).toBe(false);
  });

  it('should return false when field is not required and has data', () => {
    const props = {
      handleChange: mockHandleChange,
      path: 'testPath',
      required: false,
      data: 'value',
    } as unknown as ControlProps;
    expect(isRequiredAndHasNoData(props)).toBe(false);
  });
});

describe('onKeyPressForTextControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange when key is Enter', () => {
    onKeyPressForTextControl({
      value: 'test',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 'test');
  });

  it('should not call handleChange when key is Tab', () => {
    onKeyPressForTextControl({
      value: 'test',
      key: 'Tab',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should not call handleChange when key is Shift', () => {
    onKeyPressForTextControl({
      value: 'test',
      key: 'Shift',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should call handleChange with empty string for empty text', () => {
    onKeyPressForTextControl({
      value: '',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', '');
  });

  it('should handle special characters in text', () => {
    onKeyPressForTextControl({
      value: '@#$%',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', '@#$%');
  });
});

describe('onKeyPressNumericControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange with numeric value for valid number string', () => {
    onKeyPressNumericControl({
      value: '123',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 123);
  });

  it('should call handleChange with undefined for empty string', () => {
    onKeyPressNumericControl({
      value: '',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should not call handleChange when key is Tab', () => {
    onKeyPressNumericControl({
      value: '123',
      key: 'Tab',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should handle negative numbers', () => {
    onKeyPressNumericControl({
      value: '-456',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', -456);
  });

  it('should handle decimal numbers', () => {
    onKeyPressNumericControl({
      value: '123.45',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should handle zero', () => {
    onKeyPressNumericControl({
      value: '0',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 0);
  });
});

describe('onKeyPressForTimeControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange for valid key press with time', () => {
    onKeyPressForTimeControl({
      value: '14:30',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', '14:30');
  });

  it('should not call handleChange for Tab key', () => {
    onKeyPressForTimeControl({
      value: '14:30',
      key: 'Tab',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should call handleChange with undefined for empty time', () => {
    onKeyPressForTimeControl({
      value: '',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should handle time with seconds', () => {
    onKeyPressForTimeControl({
      value: '14:30:45',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });
});

describe('onKeyPressForDateControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange for valid date', () => {
    onKeyPressForDateControl({
      value: '2023-01-15',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should not call handleChange for Tab key', () => {
    onKeyPressForDateControl({
      value: '2023-01-15',
      key: 'Tab',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should call handleChange with undefined for invalid date', () => {
    onKeyPressForDateControl({
      value: 'invalid',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should call handleChange with undefined for empty date', () => {
    onKeyPressForDateControl({
      value: '',
      key: 'Enter',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });
});

describe('onBlurForTextControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange when required and data is empty', () => {
    onBlurForTextControl({
      value: 'test',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 'test');
  });

  it('should not call handleChange when not required', () => {
    onBlurForTextControl({
      value: 'test',
      controlProps: { ...baseControlProps, required: false, data: 'value' } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should call handleChange with undefined for empty string when required', () => {
    onBlurForTextControl({
      value: '',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should not call handleChange when required but data already has value', () => {
    onBlurForTextControl({
      value: 'new',
      controlProps: { ...baseControlProps, required: true, data: 'existing' } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });
});

describe('onBlurForNumericControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange with numeric value when required and empty', () => {
    onBlurForNumericControl({
      value: '456',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 456);
  });

  it('should not call handleChange when not required', () => {
    onBlurForNumericControl({
      value: '456',
      controlProps: { ...baseControlProps, required: false, data: 'value' } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should call handleChange with undefined for empty string when required', () => {
    onBlurForNumericControl({
      value: '',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should handle zero when required and empty', () => {
    onBlurForNumericControl({
      value: '0',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 0);
  });

  it('should handle negative numbers when required and empty', () => {
    onBlurForNumericControl({
      value: '-789',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', -789);
  });
});

describe('onBlurForDateControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange for valid date when required and empty', () => {
    onBlurForDateControl({
      value: '2023-01-15',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should not call handleChange when not required', () => {
    onBlurForDateControl({
      value: '2023-01-15',
      controlProps: { ...baseControlProps, required: false, data: 'value' } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should call handleChange with undefined for invalid date when required and empty', () => {
    onBlurForDateControl({
      value: 'invalid',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should call handleChange with undefined for empty date when required and empty', () => {
    onBlurForDateControl({
      value: '',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });
});

describe('onBlurForTimeControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange for valid time when required and empty', () => {
    onBlurForTimeControl({
      value: '14:30',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', '14:30');
  });

  it('should not call handleChange when not required', () => {
    onBlurForTimeControl({
      value: '14:30',
      controlProps: { ...baseControlProps, required: false, data: 'value' } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should call handleChange with undefined for empty time when required and empty', () => {
    onBlurForTimeControl({
      value: '',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should call handleChange with invalid time value when required and empty', () => {
    onBlurForTimeControl({
      value: 'invalid',
      controlProps: { ...baseControlProps, required: true, data: '' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 'invalid');
  });
});

describe('onChangeForInputControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange with the input value', () => {
    onChangeForInputControl({
      value: 'test input',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', 'test input');
  });

  it('should call handleChange with undefined for empty string', () => {
    onChangeForInputControl({
      value: '',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
  });

  it('should handle special characters', () => {
    onChangeForInputControl({
      value: '!@#$%^&*()',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', '!@#$%^&*()');
  });
});

describe('onChangeForDateControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange for valid date', () => {
    onChangeForDateControl({
      value: '2023-01-15',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should not call handleChange for empty date', () => {
    onChangeForDateControl({
      value: '',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should handle invalid date input', () => {
    onChangeForDateControl({
      value: 'invalid-date',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should call handleChange with different date values', () => {
    const dates = ['2023-01-15', '2024-12-31', '2000-01-01'];
    dates.forEach((date) => {
      mockHandleChange.mockClear();
      onChangeForDateControl({
        value: date,
        controlProps: { ...baseControlProps } as ControlProps,
      });
      expect(mockHandleChange).toHaveBeenCalled();
    });
  });

  it('should not call handleChange when date matches data', () => {
    const sameDate = '2023-01-15';
    onChangeForDateControl({
      value: sameDate,
      controlProps: { ...baseControlProps, data: sameDate } as ControlProps,
    });
  });

  it('should call handleChange when new date is different from data', () => {
    onChangeForDateControl({
      value: '2023-01-15',
      controlProps: { ...baseControlProps, data: '2023-01-14' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });
});

describe('onChangeForDateTimeControl', () => {
  const mockHandleChange = jest.fn();
  const baseControlProps: Partial<ControlProps> = {
    handleChange: mockHandleChange,
    path: 'testPath',
    data: undefined,
  };

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('should call handleChange for valid datetime', () => {
    onChangeForDateTimeControl({
      value: '2023-01-15T14:30:00Z',
      controlProps: { ...baseControlProps } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should not call handleChange for empty datetime', () => {
    onChangeForDateTimeControl({
      value: '',
      controlProps: { ...baseControlProps } as ControlProps,
    });
  });

  it('should not call handleChange for null datetime value', () => {
    onChangeForDateTimeControl({
      value: null as unknown as string,
      controlProps: { ...baseControlProps } as ControlProps,
    });
  });

  it('should handle data change detection', () => {
    onChangeForDateTimeControl({
      value: '2023-01-15T14:30:00Z',
      controlProps: { ...baseControlProps, data: '2023-01-15T10:00:00Z' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should skip for numeric value datetime', () => {
    onChangeForDateTimeControl({
      value: 123 as unknown as string,
      controlProps: { ...baseControlProps } as ControlProps,
    });
  });

  it('should not call handleChange for undefined datetime value', () => {
    onChangeForDateTimeControl({
      value: undefined as unknown as string,
      controlProps: { ...baseControlProps } as ControlProps,
    });
  });

  it('should not call handleChange when datetime equals data after conversion', () => {
    const isoDate = '2023-01-15T14:30:00.000Z';
    mockHandleChange.mockClear();
    onChangeForDateTimeControl({
      value: '2023-01-15T14:30:00.000Z',
      controlProps: { ...baseControlProps, data: isoDate } as ControlProps,
    });
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  it('should handle datetime with milliseconds', () => {
    mockHandleChange.mockClear();
    onChangeForDateTimeControl({
      value: '2023-12-31T23:59:59.999Z',
      controlProps: { ...baseControlProps, data: '2023-12-31T00:00:00.000Z' } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  // Target line 202 - numeric control with null value
  it('should handle null value in numeric control by calling handleChange with null', () => {
    mockHandleChange.mockClear();
    onChangeForNumericControl({
      value: null,
      controlProps: { ...baseControlProps, data: 42 } as ControlProps,
    });
    expect(mockHandleChange).toHaveBeenCalledWith('testPath', null);
  });
});
