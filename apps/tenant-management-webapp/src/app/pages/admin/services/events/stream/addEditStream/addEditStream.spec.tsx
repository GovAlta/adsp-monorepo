import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AddEditStream } from './addEditStream';
import { EditModalType, AddModalType, Stream } from '@store/stream/models';

const mockStore = configureStore([]);

const SUBSCRIBE = 'Subscribe';
const EVENT_SERVICE = 'urn:ads:platform:event-service';

const existingStream: Stream = {
  id: 'test-stream',
  name: 'test stream',
  description: '',
  events: [],
  publicSubscribe: false,
  subscriberRoles: [],
};

const buildState = (stream: Stream) => ({
  session: {
    modal: {
      [EditModalType]: { isOpen: true, id: stream.id },
      [AddModalType]: { isOpen: false },
    },
  },
  stream: { tenant: { [stream.id]: stream } },
  tenant: { name: 'autotest', realmRoles: [{ name: 'tester' }] },
  serviceRoles: { keycloak: { [EVENT_SERVICE]: { roles: [{ role: 'stream-listener' }] } } },
});

const renderModal = (stream: Stream = existingStream) => {
  const onSave = jest.fn();
  render(
    <Provider store={mockStore(buildState(stream))}>
      <AddEditStream onSave={onSave} eventDefinitions={{}} streams={{}} />
    </Provider>
  );
  return onSave;
};

const checkboxFor = (role: string) => screen.getByRole('checkbox', { name: `${role} ${SUBSCRIBE}` });

// GoabButton exposes its click as a `_click` custom event on the underlying goa-button element.
const save = () => fireEvent(document.querySelector('goa-button[testid="form-save"]'), new CustomEvent('_click'));

describe('AddEditStream subscriber roles', () => {
  it('checks a realm role and keeps it checked', () => {
    const onSave = renderModal();

    expect(checkboxFor('tester')).not.toBeChecked();
    fireEvent.click(checkboxFor('tester'));

    expect(checkboxFor('tester')).toBeChecked();
    save();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ subscriberRoles: ['tester'] }));
  });

  it('checks a client role and stores it as a urn', () => {
    const onSave = renderModal();

    fireEvent.click(checkboxFor('stream-listener'));

    expect(checkboxFor('stream-listener')).toBeChecked();
    save();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ subscriberRoles: [`${EVENT_SERVICE}:stream-listener`] })
    );
  });

  it('unchecks a role that was already selected', () => {
    const onSave = renderModal({ ...existingStream, subscriberRoles: ['tester'] });

    expect(checkboxFor('tester')).toBeChecked();
    fireEvent.click(checkboxFor('tester'));

    expect(checkboxFor('tester')).not.toBeChecked();
    save();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ subscriberRoles: [] }));
  });

  it('keeps selections from one client table when another is changed', () => {
    const onSave = renderModal();

    fireEvent.click(checkboxFor('tester'));
    fireEvent.click(checkboxFor('stream-listener'));

    expect(checkboxFor('tester')).toBeChecked();
    expect(checkboxFor('stream-listener')).toBeChecked();
    save();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriberRoles: expect.arrayContaining(['tester', `${EVENT_SERVICE}:stream-listener`]),
      })
    );
  });
});
