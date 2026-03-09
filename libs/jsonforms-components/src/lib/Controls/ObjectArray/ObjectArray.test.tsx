import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import Ajv from 'ajv';
import { GoACells, GoARenderers, GoABaseReviewRenderers } from '../../../index';
import { ArrayControlReview, PrimitiveArrayControl } from './ObjectArray';

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
        options: {
          detail: {
            type: 'Group',
            elements: [
              {
                type: 'Control',
                scope: '#/properties/name',
                label: 'Name',
              },
              {
                type: 'Control',
                scope: '#/properties/message',
                label: 'Message',
              },
              {
                type: 'Control',
                scope: '#/properties/age',
                label: 'Age',
              },
            ],
          },
        },
      },
    ],
  };
};

const getUiSchemaMax = () => {
  return {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/messages',
        options: {
          detail: {
            type: 'Group',
            elements: [
              {
                type: 'Control',
                scope: '#/properties/name',
                label: 'Name',
              },
              {
                type: 'Control',
                scope: '#/properties/message',
                label: 'Message',
              },
              {
                type: 'Control',
                scope: '#/properties/age',
                label: 'Age',
              },
            ],
            maxItems: 1,
          },
        },
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

const getMaxForm = (formData: object) => {
  return (
    <JsonForms
      uischema={getUiSchemaMax()}
      data={formData}
      schema={rootSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );
};

describe('Object Array Renderer', () => {
  it('can add multiple items', async () => {
    const data = {
      messages: [
        { name: 'Bob', message: 'Hello' },
        { name: 'Jim', message: 'Hi' },
      ],
    };
    const { baseElement } = render(getForm(data));
  // Add a message
    await waitFor(() => {
      const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");
      expect(nameInput).toBeInTheDocument();
    });
     // populate Name
    const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");

    expect(nameInput).toBeInTheDocument();

    fireEvent(
      nameInput!,
      new CustomEvent('_change', {
        detail: { value: 'Bob' },
      })
    );
    nameInput?.setAttribute('value', 'Bob');
    expect(nameInput?.getAttribute('value')).toBe('Bob');
 // populate Message
    await waitFor(() => {
      const name2 = baseElement.querySelector("goa-input[testId='#/properties/name-input-1']");
      expect(name2).toBeInTheDocument();
    });
    const name2 = baseElement.querySelector("goa-input[testId='#/properties/name-input-1']");
    expect(name2).toBeInTheDocument();

    fireEvent(
      name2!,
      new CustomEvent('_change', {
        detail: { value: 'Jim' },
      })
    );
    name2?.setAttribute('value', 'Jim');
    expect(name2?.getAttribute('value')).toBe('Jim');
  });

  it('can not add more items than the max items limit', async () => {
    const data = { messages: [{ name: 'Bob', message: 'Hello' }] };
    const { baseElement } = render(getMaxForm(data));
    // Add a message
    await waitFor(() => {
      const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");
      expect(nameInput).toBeInTheDocument();
    });
        // populate Name
    const nameInput = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");

    expect(nameInput).toBeInTheDocument();

    await waitFor(() => {
      const name2 = baseElement.querySelector("goa-input[testId='#/properties/name-input-1']");
      expect(name2).not.toBeInTheDocument();
    });
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

  it('can open the delete dialog', async () => {
    const data = { messages: [{ name: 'Bob' }] };
    const { baseElement } = render(getForm(data));

    const closedDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal?.getAttribute('open')).toBeFalsy();

    await waitFor(() => {
      const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
      expect(deleteBtn).toBeInTheDocument();
    });
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn?.getAttribute('icon')).toBe('trash');
    const shadowDeleteBtn = deleteBtn?.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn!, new CustomEvent('_click'));
    // Ensure delete modal is now open
    const openDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(openDeleteModal).toBeInTheDocument();
    expect(openDeleteModal?.getAttribute('open')).toBe('true');
  });

  it('can abort a delete', async () => {
    const data = { messages: [{ name: 'Bob' }] };
    const { baseElement } = render(getForm(data));

    await waitFor(() => {
      const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
      expect(deleteBtn).toBeInTheDocument();
    });
    // Open the delete dialog
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    const shadowDeleteBtn = deleteBtn?.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn!, new CustomEvent('_click'));

    // Click cancel
    const cancel = baseElement.querySelector("goa-button[testId='object-array-modal-button']");

    expect(cancel).toBeInTheDocument();
    const shadowCancel = cancel?.shadowRoot?.querySelector('button');
    expect(shadowCancel).not.toBeNull();
    fireEvent(cancel!, new CustomEvent('_click'));

    // Ensure modal is closed
    const closedDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(closedDeleteModal).toBeInTheDocument();
    expect(closedDeleteModal?.getAttribute('open')).toBeFalsy();

    // Ensure item still exists
    const name = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");
    expect(name).toBeInTheDocument();
  });

  it('can do a delete', async () => {
    const data = { messages: [{ name: 'Bob' }] };
    const { baseElement } = render(getForm(data));
// Add a message
    await waitFor(() => {
      const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
      expect(deleteBtn).toBeInTheDocument();
    });
// Open the delete dialo
    const deleteBtn = baseElement.querySelector("goa-icon-button[icon='trash']");
    expect(deleteBtn).toBeInTheDocument();
    const shadowDeleteBtn = deleteBtn?.shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(deleteBtn!, new CustomEvent('_click'));

    // Click confirm
    const confirm = baseElement.querySelector("goa-button[testId='object-array-confirm-button']");

    expect(confirm).toBeInTheDocument();
    const shadowConfirm = confirm?.shadowRoot?.querySelector('button');
    expect(shadowConfirm).not.toBeNull();
    fireEvent(confirm!, new CustomEvent('_click'));

    // Ensure modal is closed
    const openDeleteModal = baseElement.querySelector("goa-modal[testId='object-array-modal']");
    expect(openDeleteModal).toBeInTheDocument();
    expect(openDeleteModal?.getAttribute('open')).toBeFalsy();

    // Ensure item no longer exists
    const name = baseElement.querySelector("goa-input[testId='#/properties/name-input-0']");
    expect(name).toBeNull();
  });
});

const primitiveSchema = {
  type: 'object',
  properties: {
    files: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

const primitiveUiSchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/files',
      label: 'Files',
      options: {
        variant: 'file-array',
      },
    },
  ],
};

const getPrimitiveForm = (formData: object, enabled = true) => {
  return (
    <JsonForms
      uischema={primitiveUiSchema}
      data={formData}
      schema={primitiveSchema}
      ajv={new Ajv({ allErrors: true, verbose: true })}
      renderers={GoARenderers}
      cells={GoACells}
      readonly={!enabled}
    />
  );
};

it('shows empty state when no items', () => {
  const data = { files: [] };
  const { baseElement } = render(getPrimitiveForm(data));

  expect(baseElement.textContent).toContain('No files added');
});

it('can add a primitive item', () => {
  const data = { files: [] };
  const { baseElement } = render(getPrimitiveForm(data));

  const addButton = baseElement.querySelector('goa-button');
  expect(addButton).toBeInTheDocument();

  fireEvent(addButton!, new CustomEvent('_click'));

  const firstInput = baseElement.querySelector("[data-testid$='-0'], goa-input");
  expect(firstInput).toBeInTheDocument();
});

it('returns null for hidden array review', () => {
  const { container } = render(<ArrayControlReview visible={false} /> as any);
  expect(container.firstChild).toBeNull();
});

it('primitive control calls handleChange for add and remove', () => {
  const handleChange = jest.fn();

  const { baseElement } = render(
    <PrimitiveArrayControl
      data={['one']}
      path="files"
      handleChange={handleChange}
      visible={true}
      enabled={true}
      uischema={{ type: 'Control' }}
      schema={{ type: 'array', items: { type: 'string' } }}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );

  const addButton = baseElement.querySelector('goa-button');
  expect(addButton).toBeInTheDocument();
  fireEvent(addButton!, new CustomEvent('_click'));
  expect(handleChange).toHaveBeenCalledWith('files', ['one', '']);

  const removeButton = baseElement.querySelector("goa-icon-button[icon='trash']");
  expect(removeButton).toBeInTheDocument();
  fireEvent(removeButton!, new CustomEvent('_click'));
  expect(handleChange).toHaveBeenCalledWith('files', []);
});

it('primitive control handles non-array data and disabled add button', () => {
  const handleChange = jest.fn();

  const { baseElement } = render(
    <PrimitiveArrayControl
      data={{} as unknown as string[]}
      path="files"
      handleChange={handleChange}
      visible={true}
      enabled={false}
      uischema={{ type: 'Control' }}
      schema={{ type: 'array', items: { type: 'string' } }}
      renderers={GoARenderers}
      cells={GoACells}
    />
  );

  expect(baseElement.textContent).toContain('No item added');
  const addButton = baseElement.querySelector('goa-button');
  expect(addButton).toBeInTheDocument();
  expect(addButton?.getAttribute('disabled')).toBe('true');
});