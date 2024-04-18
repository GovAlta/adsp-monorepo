import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EnumSelect, numControl, GoAEnumControlTester } from './InputEnum';
import { ControlElement, ControlProps, EnumCellProps, OwnPropsOfEnum, WithClassname } from '@jsonforms/core';
import { TranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import { WithOptionLabel } from '../../util';
import { debug } from 'console';

type EnumSelectProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps & WithOptionLabel;
type NumProps = ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps;
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
  const numProps: NumProps = {
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
      debug(dropdown);
      const onChange = fireEvent.change(dropdown, { target: { value: 'Option2' } });
      handleChangeMock();
      expect(props.handleChange).toBeCalled();
      expect(onChange).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(1);
    });
  });

  describe('Enum Control', () => {
    it('renders Enum control', () => {
      const props = { ...numProps };
      const control = render(numControl(props));
      expect(control).toBeDefined();
    });
  });
});
