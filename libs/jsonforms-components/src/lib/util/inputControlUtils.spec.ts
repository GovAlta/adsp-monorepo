import { onChangeForCheckboxData, onChangeForNumericControl } from './inputControlUtils';
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
        data: undefined
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call handleChange with number when input is valid string number', () => {
        onChangeForNumericControl({
            value: '123',
            controlProps: baseControlProps as ControlProps
        });
        expect(mockHandleChange).toHaveBeenCalledWith('testPath', 123);
    });

    it('should call handleChange with undefined when input is empty string', () => {
        onChangeForNumericControl({
            value: '',
            controlProps: baseControlProps as ControlProps
        });
        expect(mockHandleChange).toHaveBeenCalledWith('testPath', undefined);
    });

    it('should NOT call handleChange when value is same as data', () => {
        onChangeForNumericControl({
            value: '123',
            controlProps: { ...baseControlProps, data: 123 } as ControlProps
        });
        expect(mockHandleChange).not.toHaveBeenCalled();
    });

    it('should call handleChange with 0 when value is 0 (number)', () => {
        onChangeForNumericControl({
            value: 0,
            controlProps: baseControlProps as ControlProps
        });
        expect(mockHandleChange).toHaveBeenCalledWith('testPath', 0);
    });

    it('should call handleChange with null when value is null', () => {
        onChangeForNumericControl({
            value: null,
            controlProps: baseControlProps as ControlProps
        });
        expect(mockHandleChange).toHaveBeenCalledWith('testPath', null);
    });
});
