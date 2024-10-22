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
    const data = {};
    const renderer = render(getForm(data));

    // Add a message
    const addButton = renderer.getByTestId('object-array-toolbar-Messages');
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent.click(shadowAddBtn!);

    // populate Name
    const name = renderer.getByTestId('#/properties/name-input-0');
    expect(name).toBeInTheDocument();
    fireEvent(
      name,
      new CustomEvent('_change', {
        detail: { value: 'Bob', name: 'name' },
      })
    );
    expect(name).toHaveValue('Bob');

    // populate Message
    const message = renderer.getByTestId('#/properties/message-input-0');
    expect(message).toBeInTheDocument();
    fireEvent.change(message!, { target: { value: 'The rain in Spain' } });
    expect(message).toHaveValue('The rain in Spain');

    // add another button
    fireEvent.click(shadowAddBtn!);

    const name2 = renderer.getByTestId('#/properties/name-input-1');
    expect(name2).toBeInTheDocument();

    fireEvent(
      name2,
      new CustomEvent('_change', {
        detail: { value: 'Jim', name: 'name' },
      })
    );
    expect(name2).toHaveValue('Jim');
  });

  it('read from existing data', () => {
    const data = { messages: [{ name: 'Bob' }] };
    const renderer = render(getForm(data));

    const name = renderer.getByTestId('#/properties/name-input-0');

    expect(name).toHaveValue('Bob');
  });
  it('read from existing data and display in review', () => {
    const data = { messages: [{ name: 'Bob' }] };
    const renderer = render(getReviewForm(data));

    const name = renderer.getByTestId('#/properties/name-input-0-review');

    expect(name).toHaveTextContent('Bob');
  });

  it('can open the delete dialog', () => {
    const data = { messages: ['42'] };
    const renderer = render(getForm(data));

    // Add a message
    const addButton = renderer.getByTestId('object-array-toolbar-Messages');
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent.click(shadowAddBtn!);

    // Ensure delete modal is closed
    const closedDeleteModal = renderer.getByTestId('object-array-modal');
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal.getAttribute('open')).toBe('false');

    // Open the delete Dialog
    const deleteBtn = renderer.container.querySelector('goa-icon-button');
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn?.getAttribute('icon')).toBe('trash');
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent.click(shadowDeleteBtn!);

    // Ensure delete modal is now open
    const openDeleteModal = renderer.getByTestId('object-array-modal');
    expect(openDeleteModal).toBeInTheDocument();
    expect(openDeleteModal.getAttribute('open')).toBe('true');
  });

  it('can abort a delete', () => {
    const data = { messages: [] };
    const renderer = render(getForm(data));

    // Add a message
    const addButton = renderer.getByTestId('object-array-toolbar-Messages');
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent.click(shadowAddBtn!);

    // Open the delete dialog
    const deleteBtn = renderer.container.querySelector('goa-icon-button');
    expect(deleteBtn).toBeInTheDocument();
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent.click(shadowDeleteBtn!);

    // Click cancel
    const cancel = renderer.getByTestId('object-array-modal-button');
    expect(cancel).toBeInTheDocument();
    const shadowCancel = cancel.shadowRoot?.querySelector('button');
    expect(shadowCancel).not.toBeNull();
    fireEvent.click(shadowCancel!);

    // Ensure modal is closed
    const closedDeleteModal = renderer.getByTestId('object-array-modal');
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal.getAttribute('open')).toBe('false');

    // Ensure item still exists
    const name = renderer.getByTestId('#/properties/name-input-0');
    expect(name).toBeInTheDocument();
  });

  it('can do a delete', () => {
    const data = { messages: [] };
    const renderer = render(getForm(data));

    // Add a message
    const addButton = renderer.getByTestId('object-array-toolbar-Messages');
    expect(addButton).toBeInTheDocument();
    const shadowAddBtn = addButton.shadowRoot?.querySelector('button');
    expect(shadowAddBtn).not.toBeNull();
    fireEvent.click(shadowAddBtn!);

    // Open the delete dialog
    const deleteBtn = renderer.container.querySelector('goa-icon-button');
    expect(deleteBtn).toBeInTheDocument();
    const shadowDeleteBtn = deleteBtn!.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent.click(shadowDeleteBtn!);

    // Click cancel
    const confirm = renderer.getByTestId('object-array-confirm-button');
    expect(confirm).toBeInTheDocument();
    const shadowConfirm = confirm.shadowRoot?.querySelector('button');
    expect(shadowConfirm).not.toBeNull();
    fireEvent.click(shadowConfirm!);

    // Ensure modal is closed
    const closedDeleteModal = renderer.getByTestId('object-array-modal');
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal.getAttribute('open')).toBe('false');

    // Ensure item no longer exists
    const name = renderer.queryByTestId('#/properties/name-input-0');
    expect(name).toBeNull();
  });
});
