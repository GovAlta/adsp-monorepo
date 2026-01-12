import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';
import { GoACells, GoARenderers, GoABaseReviewRenderers } from '../../../index';

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
  age: {
    type: 'number',
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
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/messages',
      },
    ],
  };
};

const getForm = (formData: object) => {
  return (
    <JsonForms
      uischema={getUiSchema()}
      data={formData}
      schema={rootSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );
};
const getReviewForm = (formData: object) => {
  return (
    <JsonForms
      uischema={getUiSchema()}
      data={formData}
      schema={rootSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoABaseReviewRenderers}
      cells={GoACells}
    />
  );
};

describe('Object Array Renderer', () => {
  it('can add multiple items', async () => {
    const data = { messages: [] };
    const { baseElement } = render(getForm(data));

    // Add a message
    const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");

    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();

    fireEvent(addButton, new CustomEvent('_click'));
    // populate Name
    const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");

    expect(nameInput).toBeInTheDocument();

    fireEvent(
      nameInput,
      new CustomEvent('_change', {
        detail: { value: 'Bob' },
      })
    );
    nameInput?.setAttribute('value', 'Bob');
    expect(nameInput?.getAttribute('value')).toBe('Bob');

    // populate Message
    const messageInput = baseElement.querySelector("goa-input[testId='#/properties/message-input-0']");

    expect(messageInput).toBeInTheDocument();
    messageInput?.setAttribute('value', 'The rain in Spain');
    fireEvent.change(
      messageInput,
      new CustomEvent('_change', {
        detail: { value: 'The rain in Spain' },
      })
    );

    // add another button

    fireEvent(addButton, new CustomEvent('_click'));

    const name2 = baseElement.querySelector("goa-input[testId='#/properties/name-input-1']");
    expect(name2).toBeInTheDocument();

    fireEvent(
      name2,
      new CustomEvent('_change', {
        detail: { value: 'Jim' },
      })
    );
    name2?.setAttribute('value', 'Jim');
    expect(name2?.getAttribute('value')).toBe('Jim');
  });

  it('read from existing data', () => {
    const data = { messages: [{ name: 'Bob' }] };
    const { baseElement } = render(getForm(data));

    const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");

    expect(nameInput?.getAttribute('value')).toBe('Bob');
  });
  it('read from existing data and display in review', () => {
    const data = { messages: [{ name: 'Bob' }] };
    const renderer = render(getReviewForm(data));

    const name = renderer.getByTestId('#/properties/name-input-0-review');

    expect(name).toHaveTextContent('Bob');
  });

  it('can open the delete dialog', () => {
    const data = { messages: ['42'] };
    const { baseElement } = render(getForm(data));

    // Add a message
    const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent(addButton, new CustomEvent('_click'));

    // Ensure delete modal is closed
    const closedDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");

    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal.getAttribute('open')).toBeFalsy();

    // Open the delete Dialog
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn?.getAttribute('icon')).toBe('trash');
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn, new CustomEvent('_click'));

    // Ensure delete modal is now open
    const openDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(openDeleteModal).toBeInTheDocument();
    expect(openDeleteModal.getAttribute('open')).toBe('true');
  });

  it('can abort a delete', () => {
    const data = { messages: [] };
    const { baseElement } = render(getForm(data));

    // Add a message
    const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent(addButton, new CustomEvent('_click'));

    // Open the delete dialog
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn, new CustomEvent('_click'));

    // Click cancel
    const cancel = baseElement.querySelector("goa-button[testId='object-array-modal-button']");

    expect(cancel).toBeInTheDocument();
    const shadowCancel = cancel.shadowRoot?.querySelector('button');
    expect(shadowCancel).not.toBeNull();
    fireEvent(cancel, new CustomEvent('_click'));

    // Ensure modal is closed
    const closedDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal.getAttribute('open')).toBeFalsy();

    // Ensure item still exists
    const name = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");
    expect(name).toBeInTheDocument();
  });

  it('can do a delete', () => {
    const data = { messages: [] };
    const { baseElement } = render(getForm(data));

    // Add a message
    const addButton = baseElement.querySelector("goa-button[testId='object-array-toolbar-Messages']");
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent(addButton, new CustomEvent('_click'));

    // Open the delete dialog
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn, new CustomEvent('_click'));

    // Click confirm
    const confirm = baseElement.querySelector("goa-button[testId='object-array-confirm-button']");

    expect(confirm).toBeInTheDocument();
    const shadowConfirm = confirm.shadowRoot?.querySelector('button');
    expect(shadowConfirm).not.toBeNull();
    fireEvent(confirm, new CustomEvent('_click'));

    // Ensure modal is closed
    const openDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(openDeleteModal).toBeInTheDocument();
    expect(openDeleteModal.getAttribute('open')).toBeFalsy();

    // Ensure item no longer exists
    const name = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");
    expect(name).toBeNull();
  });
});
