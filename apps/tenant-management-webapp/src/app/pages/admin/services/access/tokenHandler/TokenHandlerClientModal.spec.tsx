import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';

import { TokenHandlerClientModal } from './TokenHandlerClientModal';

// Web component test IDs are rendered as the testid attribute.
const goaElement = (testId: string) => document.querySelector(`[testid="${testId}"]`);

describe('TokenHandlerClientModal', () => {
  const mockStore = configureStore([]);

  const renderModal = (onSave = jest.fn()) => {
    render(
      <Provider
        store={mockStore({
          tokenHandler: {
            clients: { mine: { id: 'mine', name: 'Mine', targets: {} } },
            coreClients: { builder: { id: 'builder', name: 'Builder', core: true, targets: {} } },
          },
        })}
      >
        <TokenHandlerClientModal client={null} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    return onSave;
  };

  const save = (name: string) => {
    fireEvent(
      goaElement('client-name-input') as Element,
      new CustomEvent('_change', { detail: { name: 'client-name', value: name } }),
    );
    fireEvent(document.querySelector('goa-button[type="primary"]') as Element, new CustomEvent('_click'));
  };

  it('prevents adding a client with the ID of a core client', () => {
    const onSave = renderModal();

    save('Builder');

    expect(onSave).not.toHaveBeenCalled();
    expect(document.querySelector('goa-form-item[error]')?.getAttribute('error')).toContain(
      'A client with ID "builder" already exists',
    );
  });

  it('prevents adding a client with the ID of a tenant client', () => {
    const onSave = renderModal();

    save('Mine');

    expect(onSave).not.toHaveBeenCalled();
  });

  it('can add a client with a new ID', () => {
    const onSave = renderModal();

    save('Another app');

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'another-app', name: 'Another app' }));
  });
});
