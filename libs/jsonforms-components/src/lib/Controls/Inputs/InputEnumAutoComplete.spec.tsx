import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv8';
import { ContextProviderC, GoACells, GoARenderers } from '../../../index';
import { UISchemaElement } from '@jsonforms/core';
import axios from 'axios';

/**
 * VERY IMPORTANT:  Rendering <JsonForms ... /> does not work unless the following
 * is included.
 */
window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: true,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
});

const getForm = (schema: object, uiSchema: UISchemaElement, data: object = {}) => {
  return (
    <JsonForms
      data={data}
      schema={schema}
      uischema={uiSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );
};

describe('Input enum autocomplete Control', () => {
  it('can render a dropdown', () => {
    const dataSchema = { type: 'object', properties: { fruit: { type: 'string', enum: ['a', 'b', 'c'] } } };
    const uiSchema = {
      type: 'Control',
      scope: '#/properties/fruit',
      label: 'Dropdown',
      options: { autocomplete: true },
    };
    const renderer = render(getForm(dataSchema, uiSchema));
    const dropdown = renderer.getByTestId('autocomplete-dropdown-Dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown.getAttribute('filterable')).toBe('true');
    const options = renderer.container.querySelectorAll('goa-dropdown-item');
    expect(options?.length).toBe(3);
  });

  it('can render a readonly dropdown', () => {
    const dataSchema = { type: 'object', properties: { fruit: { type: 'string', enum: ['a', 'b', 'c'] } } };
    const uiSchema = {
      type: 'Control',
      scope: '#/properties/fruit',
      label: 'Dropdown',
      options: { autocomplete: true, componentProps: { readOnly: true } },
    };
    const renderer = render(getForm(dataSchema, uiSchema, { fruit: 'c' }));
    console.log(renderer.baseElement.innerHTML);
    const dropdown = renderer.getByPlaceholderText('c');
    expect(dropdown).toBeInTheDocument();
  });

  it('can select a new option', () => {
    const dataSchema = { type: 'object', properties: { fruit: { type: 'string', enum: ['a', 'b', 'c'] } } };
    const uiSchema = {
      type: 'Control',
      scope: '#/properties/fruit',
      label: 'The Dropdown',
      options: { autocomplete: true },
    };
    const renderer = render(getForm(dataSchema, uiSchema, { fruit: 'c' }));
    const dropdown = renderer.getByTestId('autocomplete-dropdown-The Dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown.getAttribute('value')).toBe('c');
    fireEvent(
      dropdown,
      new CustomEvent('_change', {
        detail: { name: 'The Dropdown', value: 'b' },
      })
    );
    expect(dropdown.getAttribute('value')).toBe('b');
  });

  it('can use options provided by API call', async () => {
    const key = 'testKey';
    const url = 'http://example.com/data';
    const location = ['nested', 'data'];
    const type = 'values';
    const values = ['firstName', 'lastName'];

    const responseData = {
      nested: {
        data: [
          { firstName: 'Bob', lastName: 'Smith' },
          { firstName: 'Jim', lastName: 'Jones' },
        ],
      },
    };

    // Mocking axios.get to return the response data
    jest.spyOn(axios, 'get').mockResolvedValue({ data: responseData });

    // Calling the function

    await ContextProviderC.addDataByOptions(key, url, location, type, values);

    // Expecting processDataFunction to be called with the response data
    expect(ContextProviderC.getFormContextData('testKey')).toEqual(['Bob Smith', 'Jim Jones']);
    expect(ContextProviderC.getAllFormContextData()).toEqual([{ testKey: ['Bob Smith', 'Jim Jones'] }]);
  });
});
