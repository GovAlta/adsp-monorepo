import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv, { ErrorObject } from 'ajv';
import { GoACells, GoARenderers } from '../../../index';
import { isObjectArrayEmpty, renderCellColumn } from './ObjectListControlUtils';
import { RenderCellColumnProps } from './ObjectListControlTypes';
import { findControlLabel, humanizeAjvError } from './ListWithDetailControl'; // adjust path
import { ControlElement, Layout, UISchemaElement, JsonSchema } from '@jsonforms/core';

// Mock ResizeObserver in the scope of this test file
class MockResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

// Optionally, stub any methods or properties your component uses from ResizeObserver
global.ResizeObserver = MockResizeObserver as never;

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

const dataSchema = {
  name: {
    type: 'string',
  },
  message: {
    type: 'string',
    maxLength: 5,
  },
};

const dataSchemaRequired = {
  name: { type: 'string', title: 'Special Name' },
  message: { type: 'string' },
};

const rootSchema = {
  type: 'object',
  properties: {
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: dataSchema,
      },
    },
  },
};

const rootSchemaRequired = {
  type: 'object',
  properties: {
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: dataSchemaRequired,
        required: ['name', 'message'],
      },
    },
  },
};

const getUiSchema = () => {
  return {
    type: 'ListWithDetail',
    scope: '#/properties/messages',
    elements: [],
    options: {
      detail: {
        elements: [],
      },
    },
  };
};

const getForm = (formData: object) => {
  return (
    <JsonForms
      data={formData}
      schema={rootSchema}
      uischema={getUiSchema()}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );
};
const getFormRequired = (formData: object) => {
  return (
    <JsonForms
      data={formData}
      schema={rootSchemaRequired}
      uischema={getUiSchema()}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );
};

describe('Object Array Renderer', () => {
  it('can add a new item', () => {
    const data = { messages: [] };
    const { baseElement } = render(getForm(data));

    // Add a message
    const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton!.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent(addButton!, new CustomEvent('_click'));

    // populate Name
    const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input']");
    expect(nameInput).toBeInTheDocument();
    fireEvent(nameInput!, new CustomEvent('_change', { detail: { value: 'Bob' } }));
    expect(nameInput).toHaveAttribute('value', 'Bob');

    // populate Message

    const messageInput = baseElement.querySelector("goa-input[testId='#/properties/message-input']");
    expect(messageInput).toBeInTheDocument();
    fireEvent(messageInput!, new CustomEvent('_change', { detail: { value: 'The rain in Spain' } }));
    expect(messageInput).toHaveAttribute('value', 'The rain in Spain');
  });

  it('can open the delete dialog', () => {
    const data = { messages: [] };
    const { baseElement } = render(getForm(data));

    // Add a message
    const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton!.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent(addButton!, new CustomEvent('_click'));

    // Click continue button
    const continueBtn = baseElement.querySelector("goa-button[testid='next-list-button']");
    fireEvent(continueBtn!, new CustomEvent('_click'));

    // Ensure delete modal is closed
    const closedDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal!.getAttribute('open')).toBeFalsy();

    // Open the delete Dialog
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn?.getAttribute('icon')).toBe('trash');
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn!, new CustomEvent('_click'));

    // Ensure delete modal is now open
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal!.getAttribute('open')).toBe('true');
  });

  it('can abort a delete', () => {
    const data = { messages: [] };
    const { baseElement } = render(getForm(data));

    // Add a message

    const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");

    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton!.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent(addButton!, new CustomEvent('_click'));

    // CLick continue
    const continueBtn = baseElement.querySelector("goa-button[testid='next-list-button']");
    fireEvent(continueBtn!, new CustomEvent('_click'));

    // Open the delete dialog
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn!, new CustomEvent('_click'));

    // Click cancel
    const cancel = baseElement.querySelector("goa-button[testId='object-array-modal-button']");
    expect(cancel).toBeInTheDocument();
    const shadowCancel = cancel!.shadowRoot?.querySelector('button');
    expect(shadowCancel).not.toBeNull();
    fireEvent(cancel!, new CustomEvent('_click'));

    // Ensure modal is closed
    const closedDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");

    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal!.getAttribute('open')).toBeFalsy();

    // Ensure item still exists
    const item = baseElement.querySelector(`[data-testid="object-array-main-item-0"]`);
    expect(item).toBeInTheDocument();

    expect(item).not.toBeNull();
    expect(item!.textContent).toContain('No data');
  });

  it('can do a delete', () => {
    const data = { messages: [] };
    const { baseElement } = render(getForm(data));

    // Add a message
    const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton!.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent(addButton!, new CustomEvent('_click'));

    // Click continue
    const continueBtn = baseElement.querySelector("goa-button[testid='next-list-button']");
    fireEvent(continueBtn!, new CustomEvent('_click'));

    // Open the delete dialog
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn!, new CustomEvent('_click'));
    // Click cancel

    const confirm = baseElement.querySelector("goa-button[testId='object-array-confirm-button']");
    expect(confirm).toBeInTheDocument();
    const shadowConfirm = confirm!.shadowRoot?.querySelector('button');
    expect(shadowConfirm).not.toBeNull();
    fireEvent(confirm!, new CustomEvent('_click'));

    // Ensure modal is closed
    const closedDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal!.getAttribute('open')).toBeFalsy();

    // Ensure item no longer exists
    const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input']");
    expect(nameInput).toBeNull();
  });
});

it('errors are visible', () => {
  const data = { messages: [] };
  const { baseElement } = render(getForm(data));

  // Add a message
  const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");
  expect(addButton).toBeInTheDocument();
  const shadowAddBtn = addButton!.shadowRoot?.querySelector('button');
  expect(shadowAddBtn).not.toBeNull();
  fireEvent(addButton!, new CustomEvent('_click'));

  const messageInput = baseElement.querySelector("goa-input[testId='#/properties/message-input']");
  expect(messageInput).toBeInTheDocument();
  fireEvent(messageInput!, new CustomEvent('_change', { detail: { value: 'The rain in Spain' } }));
  expect(messageInput).toHaveAttribute('value', 'The rain in Spain');

  // Click continue
  const continueBtn = baseElement.querySelector("goa-button[testid='next-list-button']");
  fireEvent(continueBtn!, new CustomEvent('_click'));

  // Select the goa-input / form item for the message
  const messageFormItem = baseElement.querySelector('goa-form-item');
  expect(messageFormItem).not.toBeNull();

  // Check the error text
  expect(messageFormItem).toHaveAttribute('error', 'Message must be at most 5 characters');
});
it('required errors work', () => {
  const data = { messages: [] };
  const { baseElement } = render(getFormRequired(data));

  // Add a message
  const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");
  expect(addButton).toBeInTheDocument();
  const shadowAddBtn = addButton!.shadowRoot?.querySelector('button');
  expect(shadowAddBtn).not.toBeNull();
  fireEvent(addButton!, new CustomEvent('_click'));

  const messageInput = baseElement.querySelector("goa-input[testId='#/properties/message-input']");
  expect(messageInput).toBeInTheDocument();
  fireEvent(messageInput!, new CustomEvent('_change', { detail: { value: 'The rain in Spain' } }));
  expect(messageInput).toHaveAttribute('value', 'The rain in Spain');

  // Click continue
  const continueBtn = baseElement.querySelector("goa-button[testid='next-list-button']");
  fireEvent(continueBtn!, new CustomEvent('_click'));

  // Select the goa-input / form item for the message
  const messageFormItem = baseElement.querySelector('goa-form-item');
  expect(messageFormItem).not.toBeNull();

  // Check the error text
  expect(messageFormItem).toHaveAttribute('error', 'Special Name is required');
});

describe('findControlLabel', () => {
  it('returns label if uischema is a Control and scope matches', () => {
    const uischema: ControlElement = {
      type: 'Control',
      scope: '#/properties/firstName',
      label: 'First Name',
    };

    const result = findControlLabel(uischema, '#/properties/firstName');
    expect(result).toBe('First Name');
  });

  it('returns label from nested detail if hasDetail is true', () => {
    const uischema: UISchemaElement = {
      type: 'ListWithDetail',
      options: {
        detail: {
          type: 'Control',
          scope: '#/properties/lastName',
          label: 'Last Name',
        },
      },
    };

    const result = findControlLabel(uischema, '#/properties/lastName');
    expect(result).toBe('Last Name');
  });

  it('returns label from nested elements if hasElements is true', () => {
    const childControl: ControlElement = {
      type: 'Control',
      scope: '#/properties/age',
      label: 'Age',
    };

    const parentLayout: Layout = {
      type: 'VerticalLayout',
      elements: [childControl],
    };

    const result = findControlLabel(parentLayout, '#/properties/age');
    expect(result).toBe('Age');
  });

  it('returns undefined if no matching control is found', () => {
    const uischema: Layout = {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/unrelated',
          label: 'Unrelated',
        },
      ],
    };

    const result = findControlLabel(uischema, '#/properties/nonexistent');
    expect(result).toBeUndefined();
  });

  it('returns label if nested elements inside detail contain the control', () => {
    const uischema: UISchemaElement = {
      type: 'ListWithDetail',
      options: {
        detail: {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/email',
              label: 'Email',
            },
          ],
        },
      },
    };

    const result = findControlLabel(uischema, '#/properties/email');
    expect(result).toBe('Email');
  });
});

describe('humanizeAjvError', () => {
  const schema: JsonSchema = {}; // mock schema
  const uischema = { type: 'Control', scope: '/dummy' } as unknown as UISchemaElement;

  it('should handle "required" keyword', () => {
    const error: ErrorObject = {
      keyword: 'required',
      instancePath: '/name',
      schemaPath: '#/properties/name/required',
      params: {},
      message: '',
    };

    expect(humanizeAjvError(error, schema, uischema)).toBe('Name is required');
  });

  it('should handle "minLength" keyword', () => {
    const error: ErrorObject = {
      keyword: 'minLength',
      instancePath: '/password',
      schemaPath: '#/properties/password/minLength',
      params: { limit: 5 },
      message: '',
    };
    expect(humanizeAjvError(error, schema, uischema)).toBe('Password must be at least 5 characters');
  });

  it('should handle "maxLength" keyword', () => {
    const error: ErrorObject = {
      keyword: 'maxLength',
      instancePath: '/username',
      schemaPath: '#/properties/username/maxLength', // required
      params: { limit: 10 },
      message: '', // optional, but you can include
    };

    expect(humanizeAjvError(error, schema, uischema)).toBe('Username must be at most 10 characters');
  });

  it('should handle "format" keyword', () => {
    const error: ErrorObject = {
      keyword: 'format',
      instancePath: '/email',
      schemaPath: '#/properties/email/format',
      params: { format: 'email' },
      message: '',
    };
    expect(humanizeAjvError(error, schema, uischema)).toBe('Email must be a valid email');
  });

  it('should handle "minimum" keyword', () => {
    const error: ErrorObject = {
      keyword: 'minimum',
      instancePath: '/age',
      schemaPath: '#/properties/age/minimum',
      params: { limit: 18 },
      message: '',
    };
    expect(humanizeAjvError(error, schema, uischema)).toBe('Age must be ≥ 18');
  });

  it('should handle "maximum" keyword', () => {
    const error: ErrorObject = {
      keyword: 'maximum',
      instancePath: '/score',
      schemaPath: '#/properties/score/maximum',
      params: { limit: 100 },
      message: '',
    };
    expect(humanizeAjvError(error, schema, uischema)).toBe('Score must be ≤ 100');
  });

  it('should handle "type" keyword', () => {
    const error: ErrorObject = {
      keyword: 'type',
      instancePath: '/isActive',
      schemaPath: '#/properties/isActive/type',
      params: { type: 'boolean' },
      message: '',
    };
    expect(humanizeAjvError(error, schema, uischema)).toBe('Is Active must be a boolean');
  });

  it('should handle unknown keyword', () => {
    const error: ErrorObject = {
      keyword: 'custom',
      instancePath: '/field',
      schemaPath: '#/properties/password/minLength',
      params: {},
      message: 'something went wrong',
    };
    expect(humanizeAjvError(error, schema, uischema)).toBe('Field something went wrong');
  });
});

describe('ObjectListControl util functions tests', () => {
  it('can render Cell Column with warning error', () => {
    const props = {
      currentData: undefined,
      isRequired: true,
      error: 'is an error',
    } as unknown as RenderCellColumnProps;

    const element = renderCellColumn(props);
    expect(element).not.toBeNull();
  });

  it('can render Cell Column with warning error with data', () => {
    const props = {
      currentData: 'test',
      isRequired: true,
      error: '',
    } as unknown as RenderCellColumnProps;

    const element = renderCellColumn(props);
    expect(element).not.toBeNull();
  });

  it('can render Cell Column with warning error with data in array', () => {
    const arr = [
      {
        impact: 'v',
        face: 'd',
      },
    ];
    const props = {
      currentData: JSON.stringify(arr),
      isRequired: true,
      error: '',
    } as unknown as RenderCellColumnProps;

    const element = renderCellColumn(props);
    expect(element).not.toBeNull();
  });

  it('isObjectArrayEmpty util function test object emptyness', () => {
    const arr = {} as string;
    const result = isObjectArrayEmpty(arr);
    expect(result).toBe(true);
  });

  it('isObjectArrayEmpty util function test array emptyness', () => {
    const arr = [{}] as unknown as string;
    const result = isObjectArrayEmpty(arr);
    expect(result).toBe(true);
  });
});
