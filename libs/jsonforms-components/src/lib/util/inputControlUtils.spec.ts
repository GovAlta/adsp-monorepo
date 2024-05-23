import { onChangeForCheckboxData } from './inputControlUtils';

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
