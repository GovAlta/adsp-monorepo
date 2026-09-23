import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { CALENDAR_INIT } from '@store/calendar/models';
import { ActionState } from '@store/session/models';
import { CalendarModal } from './calendarModal';

const mockStore = configureStore([]);
const store = mockStore({
  calendarService: CALENDAR_INIT,
  tenant: { name: 'test-tenant', realmRoles: [] },
  serviceRoles: { keycloak: {} },
  session: { indicator: { details: { [FETCH_KEYCLOAK_SERVICE_ROLES]: ActionState.completed } } },
});

describe('CalendarModal', () => {
  it('shows a required-name error and does not save whitespace-only display names', async () => {
    const onSave = jest.fn();
    const { baseElement } = render(
      <Provider store={store}>
        <CalendarModal open tenantMode calendarName={undefined} onSave={onSave} />
      </Provider>
    );

    const nameInput = baseElement.querySelector("goa-input[testId='calendar-modal-name-input']");
    fireEvent(nameInput, new CustomEvent('_change', { detail: { value: '   ' } }));

    await waitFor(() =>
      expect(baseElement.querySelector('goa-form-item[error="name is required"]')).not.toBeNull()
    );

    fireEvent(baseElement.querySelector("goa-button[testId='calendar-modal-save']"), new CustomEvent('_click'));
    expect(onSave).not.toHaveBeenCalled();
  });
});
