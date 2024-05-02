import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EnumSelect, enumControl } from './InputEnum';
import { ControlElement, ControlProps, EnumCellProps, OwnPropsOfEnum, WithClassname } from '@jsonforms/core';
import { TranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import { WithOptionLabel } from '../../util';
import { JsonFormRegisterProvider } from '../../Context/register';

type EnumSelectProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps & WithOptionLabel;
type EnumProps = ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps & ControlProps;
describe('EnumSelect component', () => {
  const dropDownUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/age',
    label: 'Age',
  };

  const staticProps: EnumSelectProp = {
    uischema: dropDownUiSchema,
    schema: { enum: ['Option1', 'Option2', 'Option3'] },
    rootSchema: {},
    handleChange: jest.fn(),
    enabled: true,
    label: 'Enum',
    id: 'enum',
    config: {},
    path: '',
    locale: '',
    errors: '',
    data: 'Option1',
    visible: true,
    isValid: true,
    t: jest.fn(),
  };
  const enumProps: EnumProps = {
    uischema: dropDownUiSchema,
    schema: { enum: ['Option1', 'Option2', 'Option3'] },
    rootSchema: {},
    handleChange: jest.fn(),
    enabled: true,
    label: 'Enum',
    id: 'enum',
    config: {},
    path: '',
    locale: '',
    errors: '',
    data: 'Option1',
    visible: true,
    t: jest.fn(),
    required: false,
  };

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('can create EnumSelect component', () => {
    it('renders EnumSelect component', () => {
      const props = { ...staticProps };
      const component = render(<EnumSelect {...props} />);
      expect(component.getByTestId('enum-jsonform')).toBeInTheDocument();
    });
  });

  describe('can trigger input events', () => {
    it('triggers onChange event', () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const component = render(<EnumSelect {...props} />);
      const dropdown = component.getByTestId('enum-jsonform');
      fireEvent(
        dropdown,
        new CustomEvent('_change', {
          detail: { name: 'Enum', value: 'Option2' },
        })
      );
      expect(handleChangeMock.mock.lastCall).toEqual(['', 'Option2']);
    });
  });

  describe('Enum Control', () => {
    it('renders Enum control', () => {
      const props = { ...enumProps };
      const control = render(enumControl(props));
      expect(control).toBeDefined();
    });

    it('render Enum control with jsonform register context without default value', () => {
      const props = { ...staticProps };
      const component = render(
        <JsonFormRegisterProvider defaultRegisters={undefined}>
          <EnumSelect {...props} />)
        </JsonFormRegisterProvider>
      );
      expect(component.getByTestId('enum-jsonform')).toBeInTheDocument();
    });

    it('render Enum control with jsonform register context with default value', () => {
      const props = {
        ...staticProps,
        uischema: { ...dropDownUiSchema, options: { register: { url: 'mock-test' } } },
        handleChange: handleChangeMock,
      };
      const component = render(
        <JsonFormRegisterProvider defaultRegisters={[{ url: 'mock-test', data: ['item1'] }]}>
          <EnumSelect {...props} />)
        </JsonFormRegisterProvider>
      );

      const dropdown = component.getByTestId('enum-jsonform');
      fireEvent(
        dropdown,
        new CustomEvent('_change', {
          detail: { name: 'item1', value: 'item1' },
        })
      );
      expect(handleChangeMock.mock.lastCall).toEqual(['', 'item1']);
    });
  });
});
