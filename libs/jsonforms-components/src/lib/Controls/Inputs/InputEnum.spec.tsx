import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
    options: [
      {
        value: 'option1-value',
        label: 'option1-label',
      },
      {
        value: 'option2-value',
        label: 'option2-label',
      },
    ],
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
      expect(component.getByTestId('jsonforms--dropdown')).toBeTruthy();
    });
  });

  describe('can trigger input events', () => {
    it('triggers onChange event', () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      render(<EnumSelect {...props} />);

      const option = screen.getByTestId('jsonforms--dropdown-option1-label-option');

      fireEvent.click(option);

      expect(handleChangeMock.mock.lastCall).toEqual(['', 'option1-value']);
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
      expect(component.getByTestId('jsonforms--dropdown')).toBeInTheDocument();
    });

    it('render Enum control with jsonform register context with default value', () => {
      const props = {
        ...staticProps,
        uischema: { ...dropDownUiSchema, options: { register: { urn: 'mock-urn' } } },
        handleChange: handleChangeMock,
      };
      const { baseElement, ...component } = render(
        <JsonFormRegisterProvider
          defaultRegisters={{
            registerData: [
              {
                url: 'http://mock-api.com/mock-test',
                urn: 'mock-urn',
                data: ['item'],
              },
            ],
          }}
        >
          <EnumSelect {...props} />)
        </JsonFormRegisterProvider>
      );
      const dropdownInput = baseElement.querySelector("goa-input[testid='jsonforms--dropdown-input']");
      fireEvent.click(dropdownInput);
      const dropdownOption = screen.getByTestId('jsonforms--dropdown-item-option');
      fireEvent.click(dropdownOption);

      expect(handleChangeMock.mock.lastCall).toEqual(['', 'item']);
    });
  });
});
