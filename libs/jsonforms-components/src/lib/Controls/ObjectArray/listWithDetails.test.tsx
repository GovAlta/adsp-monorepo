import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv, { ErrorObject } from 'ajv';
import { GoACells, GoARenderers } from '../../../index';
import { isObjectArrayEmpty, renderCellColumn } from './ObjectListControlUtils';
import { RenderCellColumnProps } from './ObjectListControlTypes';

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
    expect(closedDeleteModal!.getAttribute('open')).toBe('false');

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
    expect(closedDeleteModal!.getAttribute('open')).toBe('false');

    // Ensure item still exists
    const item = baseElement.querySelector('goa-form-item');
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
    expect(closedDeleteModal!.getAttribute('open')).toBe('false');

    // Ensure item no longer exists
    const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input']");
    expect(nameInput).toBeNull();
  });
});

describe('ObjectListControl util functions tests', () => {
  it('can render Cell Column with warning error', () => {
    const props = {
      currentData: undefined,
      isRequired: true,
      error: 'is an error',
    } as RenderCellColumnProps;

    const element = renderCellColumn(props);
    expect(element).not.toBeNull();
  });

  it('can render Cell Column with warning error with data', () => {
    const props = {
      currentData: 'test',
      isRequired: true,
      error: '',
    } as RenderCellColumnProps;

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
    } as RenderCellColumnProps;

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
