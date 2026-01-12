import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { CellProps, ControlElement } from '@jsonforms/core';
import { GoATextCell, GoATextCellTester } from './TextCell';
import { GoAIntegerCell, GoAIntegerCellTester } from './IntegerCell';
import { GoANumberCell, GoANumberCellTester } from './NumberCell';
import { GoADateCell, GoADateCellTester } from './DateCell';
import { GoATimeCell, GoATimeCellTester } from './TimeCell';

const getProps = (schema: object, uiSchema: ControlElement, data: unknown = undefined): CellProps => {
  return {
    uischema: uiSchema,
    rootSchema: schema,
    schema: schema,
    data: data,
    isValid: true,
    id: 'A Cell',
    enabled: true,
    visible: true,
    path: '#/properties/name',
    handleChange: jest.fn(),
    errors: '',
  };
};

describe('Cell controls', () => {
  it('can render a Text Cell', () => {
    const uiSchema = { type: 'Control', scope: '#/properties/name' } as ControlElement;
    const schema = { type: 'object', properties: { name: { type: 'string' } } };
    const context = { rootSchema: schema, config: {} };
    expect(GoATextCellTester(uiSchema, schema, context)).toBe(1);
    const data = 'Bob';
    const props = getProps(schema, uiSchema, data);
    const { container } = render(<GoATextCell {...props}></GoATextCell>);
    const element = container.querySelector('goa-input');
    expect(element).toBeInTheDocument();
    expect(element?.getAttribute('type')).toBe('text');
    expect(element?.getAttribute('value')).toBe(data);
  });

  it('can render an Integer Cell', () => {
    const uiSchema = { type: 'Control', scope: '#/properties/age' } as ControlElement;
    const schema = { type: 'object', properties: { age: { type: 'integer' } } };
    const context = { rootSchema: schema, config: {} };
    expect(GoAIntegerCellTester(uiSchema, schema, context)).toBe(1);
    const data = '32';
    const props = getProps(schema, uiSchema, data);
    const { container } = render(<GoAIntegerCell {...props}></GoAIntegerCell>);
    const element = container.querySelector('goa-input');
    expect(element).toBeInTheDocument();
    expect(element?.getAttribute('type')).toBe('number');
    expect(element?.getAttribute('value')).toBe(data);
  });

  it('can render an Number Cell', () => {
    const uiSchema = { type: 'Control', scope: '#/properties/pi' } as ControlElement;
    const schema = { type: 'object', properties: { pi: { type: 'number' } } };
    const context = { rootSchema: schema, config: {} };
    expect(GoANumberCellTester(uiSchema, schema, context)).toBe(1);
    const pi = '3.14159';
    const props = getProps(schema, uiSchema, pi);
    const { container } = render(<GoANumberCell {...props}></GoANumberCell>);
    const element = container.querySelector('goa-input');
    expect(element).toBeInTheDocument();
    expect(element?.getAttribute('type')).toBe('number');
    expect(element?.getAttribute('value')).toBe(pi);
  });

  it('can render an Date Cell', () => {
    const uiSchema = { type: 'Control', scope: '#/properties/birthday' } as ControlElement;
    const schema = { type: 'object', properties: { birthday: { type: 'string', format: 'date' } } };
    const context = { rootSchema: schema, config: {} };
    expect(GoADateCellTester(uiSchema, schema, context)).toBe(1);
    const birthday = '2000-05-07';
    const props = getProps(schema, uiSchema, birthday);
    const { container } = render(<GoADateCell {...props}></GoADateCell>);
    const element = container.querySelector('goa-date-picker');
    expect(element).toBeInTheDocument();
    expect(element?.getAttribute('type')).toBe('calendar');
    expect(element?.getAttribute('value')).toBe(birthday);
  });

  it('can render a Time Cell', () => {
    const uiSchema = { type: 'Control', scope: '#/properties/noon' } as ControlElement;
    const schema = { type: 'object', properties: { noon: { type: 'string', format: 'time' } } };
    const context = { rootSchema: schema, config: {} };
    expect(GoATimeCellTester(uiSchema, schema, context)).toBe(2);
    const noon = '05/07/2000T12:00:00';
    const props = getProps(schema, uiSchema, noon);
    const { container } = render(<GoATimeCell {...props}></GoATimeCell>);
    const element = container.querySelector('goa-date-picker');
    expect(element).toBeInTheDocument();
    console.log(element?.outerHTML);
    expect(element?.getAttribute('type')).toBe('calendar');
  });
});
