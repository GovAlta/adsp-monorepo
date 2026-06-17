import {
  AUTO_POPULATE_SOURCES,
  autoPopulatePropertiesMonaco,
  autoPopulateValue,
  createAutoPopulateMiddleware,
  getAutoPopulateControls,
  getAutoPopulatedData,
  mergeAutoPopulatedData,
} from './autoPopulate';
import { User } from '../Context/register';
import { INIT } from '@jsonforms/core';

describe('autoPopulateValue', () => {
  const mockUser: User = {
    name: 'John Doe',
    email: 'john@example.com',
  } as User;

  it('returns the configured first name regardless of the field path', () => {
    expect(
      autoPopulateValue(mockUser, {
        uischema: { options: { autoPopulate: 'firstName' } },
      }),
    ).toBe('John');
  });

  it('returns the configured last name', () => {
    expect(
      autoPopulateValue(
        { ...mockUser, name: 'John Michael Doe' },
        { uischema: { options: { autoPopulate: 'lastName' } } },
      ),
    ).toBe('Doe');
  });

  it('returns the configured email address', () => {
    expect(
      autoPopulateValue(mockUser, {
        uischema: { options: { autoPopulate: 'email' } },
      }),
    ).toBe('john@example.com');
  });

  it('does not infer a value from the field name without a directive', () => {
    expect(autoPopulateValue(mockUser, {})).toBeUndefined();
  });

  it('ignores unsupported directives', () => {
    expect(
      autoPopulateValue(mockUser, {
        uischema: { options: { autoPopulate: 'fullName' } },
      }),
    ).toBeUndefined();
  });

  it('handles a user with a single name', () => {
    const user = { name: 'Prince' } as User;
    expect(autoPopulateValue(user, { uischema: { options: { autoPopulate: 'firstName' } } })).toBe('Prince');
    expect(autoPopulateValue(user, { uischema: { options: { autoPopulate: 'lastName' } } })).toBe('');
  });

  it('supports only the accepted profile fields', () => {
    expect(AUTO_POPULATE_SOURCES).toEqual(['firstName', 'lastName', 'email']);
  });

  it('does not suggest convention-based data-schema properties', () => {
    expect(autoPopulatePropertiesMonaco).toEqual([]);
  });
});

describe('getAutoPopulateControls', () => {
  it('returns empty array when element is undefined', () => {
    expect(getAutoPopulateControls(undefined)).toEqual([]);
  });
});

describe('getAutoPopulatedData', () => {
  it('returns empty array when user is undefined', () => {
    const uiSchema = { type: 'VerticalLayout', elements: [] };
    expect(getAutoPopulatedData(uiSchema, undefined)).toEqual([]);
  });
});

describe('mergeAutoPopulatedData', () => {
  it('returns original data unchanged when autoPopulatedData is empty', () => {
    const data = { foo: 'bar' };
    expect(mergeAutoPopulatedData(data, [])).toBe(data);
  });
});

describe('auto-populate middleware', () => {
  const mockUser: User = {
    name: 'John Doe',
    email: 'john@example.com',
  } as User;

  const uiSchema = {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/applicantFirstName',
        options: { autoPopulate: 'firstName' },
      },
      {
        type: 'Control',
        scope: '#/properties/contact/properties/email',
        options: { autoPopulate: 'email' },
      },
      {
        type: 'Control',
        scope: '#/properties/unconfiguredFirstName',
      },
    ],
  };

  it('adds configured values without relying on input control side effects', () => {
    const middleware = createAutoPopulateMiddleware(uiSchema, mockUser);

    const state = middleware(
      { data: {} },
      { type: INIT },
      () => ({ data: {} }),
    );

    expect(state.data).toEqual({
      applicantFirstName: 'John',
      contact: {
        email: 'john@example.com',
      },
    });
  });

  it('does not modify state for unrelated action types', () => {
    const middleware = createAutoPopulateMiddleware(uiSchema, mockUser);
    const existingState = { data: { applicantFirstName: 'Existing' } };

    const state = middleware(existingState, { type: 'SOME_OTHER_ACTION' }, () => existingState);

    expect(state).toBe(existingState);
  });

  it('does not overwrite existing values', () => {
    expect(
      mergeAutoPopulatedData(
        { applicantFirstName: 'Existing' },
        [{ path: 'applicantFirstName', value: 'John' }],
      ),
    ).toEqual({ applicantFirstName: 'Existing' });
  });
});
