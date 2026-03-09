import React from 'react';
import { render } from '@testing-library/react';
import { extractNames, extractNestedFields, isObjectArrayEmpty, renderCellColumn } from './ObjectListControlUtils';
import { objectListReducer } from './arrayData/reducer';
import { ADD_DATA_ACTION, SET_DATA_ACTION, INCREMENT_ACTION, DELETE_ACTION, ObjectArrayActions } from './arrayData/actions';

describe('extractNestedFields', () => {
  it('should skip non-array fields and return empty object for them', () => {
    const inputProperties = {
      name: { type: 'string' },
      email: { type: 'string' },
    };

    const result = extractNestedFields(inputProperties, ['name']);

    expect(result).toEqual({});
  });

  it('should handle missing properties or required fields gracefully', () => {
    const inputProperties = {
      notes: {
        type: 'array',
        items: {
          type: 'object',
          // no properties or required
        },
      },
    };

    const result = extractNestedFields(inputProperties, ['notes']);

    expect(result).toEqual({
      notes: {
        properties: [],
        required: [],
      },
    });
  });
});

describe('objectListReducer', () => {
  it('adds a new category when it does not exist', () => {
    const state = { categories: {} };
    const action = {
      type: ADD_DATA_ACTION,
      payload: { name: 'messages', category: { data: [{ name: 'Bob' }] } },
    } as unknown as ObjectArrayActions;

    const next = objectListReducer(state, action);

    expect(next.categories.messages).toEqual({ data: { data: [{ name: 'Bob' }] } });
  });

  it('replaces existing category data on add action', () => {
    const state = { categories: { messages: { data: { data: [{ name: 'Old' }] } } } };
    const action = {
      type: ADD_DATA_ACTION,
      payload: { name: 'messages', category: { data: [{ name: 'New' }] } },
    } as unknown as ObjectArrayActions;

    const next = objectListReducer(state, action);

    expect(next.categories.messages).toEqual({ data: { data: [{ name: 'New' }] } });
  });

  it('sets categories on set data action', () => {
    const state = { categories: {} };
    const action = {
      type: SET_DATA_ACTION,
      payload: { messages: { data: { data: [{ name: 'Bob' }] } } },
    } as unknown as ObjectArrayActions;

    const next = objectListReducer(state, action);

    expect(next.categories).toEqual({ messages: { data: { data: [{ name: 'Bob' }] } } });
  });

  it('increments count when category exists', () => {
    const state = { categories: { messages: { count: 2, data: {} } } };
    const action = { type: INCREMENT_ACTION, payload: 'messages' } as unknown as ObjectArrayActions;

    const next = objectListReducer(state, action);

    expect(next.categories.messages.count).toBe(3);
  });

  it('creates category with count on increment when missing', () => {
    const state = { categories: {} };
    const action = { type: INCREMENT_ACTION, payload: 'messages' } as unknown as ObjectArrayActions;

    const next = objectListReducer(state, action);

    expect(next.categories.messages).toEqual({ count: 1, data: {} });
  });

  it('updates category on delete action payload', () => {
    const state = { categories: { messages: { data: { data: [{ name: 'Bob' }] } } } };
    const action = {
      type: DELETE_ACTION,
      payload: { name: 'messages', category: { data: [] } },
    } as unknown as ObjectArrayActions;

    const next = objectListReducer(state, action);

    expect(next.categories.messages).toEqual({ data: [] });
  });

  it('returns existing state for unknown action type', () => {
    const state = { categories: { messages: { data: {} } } };
    const action = { type: 'UNKNOWN' } as unknown as ObjectArrayActions;

    const next = objectListReducer(state, action);

    expect(next).toBe(state);
  });
});

describe('extractNames', () => {
  it('uses label text object and prettifies fallback labels', () => {
    const names = extractNames({
      elements: [
        { scope: '#/properties/firstName', label: { text: 'First Name' } },
        { scope: '#/properties/postal_code' },
      ],
    });

    expect(names).toEqual({ firstName: 'First Name', postal_code: 'Postal code' });
  });

  it('uses direct string labels when provided', () => {
    const names = extractNames([{ scope: '#/properties/emailAddress', label: 'Email Address' }]);
    expect(names).toEqual({ emailAddress: 'Email Address' });
  });
});

describe('isObjectArrayEmpty', () => {
  it('returns true for empty object-array shape', () => {
    expect(isObjectArrayEmpty([{}] as unknown as string)).toBe(true);
  });

  it('returns false for non-empty object-array shape', () => {
    expect(isObjectArrayEmpty([{ name: 'Bob' }] as unknown as string)).toBe(false);
  });
});

describe('renderCellColumn', () => {
  it('returns warning icon cell when required data is missing', () => {
    const result = renderCellColumn({
      data: undefined,
      error: '',
      errors: [],
      index: 0,
      rowPath: 'messages',
      element: 'name',
      isRequired: true,
    });

    const { container } = render(<>{result}</>);
    expect(container.querySelector('goa-icon')).toBeTruthy();
  });

  it('renders formatted date object for yyyy-mm-dd shape', () => {
    const result = renderCellColumn({
      data: { year: 2026, month: 3, day: 9 },
      error: '',
      errors: [],
      index: 0,
      rowPath: 'messages',
      element: 'date',
      isRequired: false,
    });

    expect(result).toBe('2026-3-9');
  });

  it('renders warning for empty object data', () => {
    const result = renderCellColumn({
      data: {},
      error: '',
      errors: [],
      index: 0,
      rowPath: 'messages',
      element: 'name',
      isRequired: true,
    });

    const { container } = render(<>{result}</>);
    expect(container.querySelector('goa-icon')).toBeTruthy();
  });

  it('renders warning when nested errors exist for array data', () => {
    const result = renderCellColumn({
      data: [{ name: '' }],
      error: '',
      errors: [{ instancePath: '/messages/0/name/0', keyword: 'required', params: {}, schemaPath: '' } as any],
      index: 0,
      rowPath: 'messages',
      element: 'name',
      isRequired: false,
    });

    const { container } = render(<>{result}</>);
    expect(container.querySelector('goa-icon')).toBeTruthy();
  });

  it('renders table for valid array-of-objects data', () => {
    const result = renderCellColumn({
      data: [{ firstName: 'Alice' }],
      error: '',
      errors: [],
      index: 0,
      rowPath: 'messages',
      element: 'person',
      isRequired: true,
    });

    const { container } = render(<>{result}</>);
    expect(container.querySelector('table')).toBeTruthy();
    expect(container.textContent).toContain('Alice');
  });

  it('renders json preformatted output for object without date fields', () => {
    const result = renderCellColumn({
      data: { note: 'hello' },
      error: '',
      errors: [],
      index: 0,
      rowPath: 'messages',
      element: 'note',
      isRequired: false,
    });

    const { container } = render(<>{result}</>);
    expect(container.querySelector('pre')).toBeTruthy();
    expect(container.textContent).toContain('hello');
  });

  it('renders warning when object has error and values', () => {
    const result = renderCellColumn({
      data: { name: 'Alice' },
      error: 'Invalid',
      errors: [],
      index: 0,
      rowPath: 'messages',
      element: 'name',
      isRequired: false,
    });

    const { container } = render(<>{result}</>);
    expect(container.querySelector('goa-icon')).toBeTruthy();
  });

  it('returns null for non-string primitive data', () => {
    const result = renderCellColumn({
      data: 123 as unknown as string,
      error: '',
      errors: [],
      index: 0,
      rowPath: 'messages',
      element: 'count',
      isRequired: false,
    });

    expect(result).toBeNull();
  });
});
