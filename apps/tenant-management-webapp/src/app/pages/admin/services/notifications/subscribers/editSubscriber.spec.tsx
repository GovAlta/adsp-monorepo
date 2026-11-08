import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import { SubscriberModalForm } from './editSubscriber';

describe('SubscriberModalForm', () => {
  const mockStore = configureStore([]);
  const createStore = () => mockStore({ subscription: { updateError: '' } });

  const subscriber = {
    id: 'subscriber-1',
    addressAs: 'user-a',
    channels: [
      { channel: 'sms', address: '7801234567', verified: true },
      { channel: 'email', address: 'tester@test.co', verified: true },
    ],
  };

  const renderForm = (onSave: jest.Mock) =>
    render(
      <Provider store={createStore()}>
        <SubscriberModalForm open={true} initialValue={subscriber} onSave={onSave} onCancel={jest.fn()} />
      </Provider>,
    );

  const changePhone = (baseElement: HTMLElement, value: string) =>
    fireEvent(
      baseElement.querySelector("goa-input[testId='contact-sms-input']"),
      new CustomEvent('_change', { detail: { name: 'sms', value } }),
    );

  const save = (baseElement: HTMLElement) =>
    fireEvent(baseElement.querySelector("goa-button[testId='form-save']"), new CustomEvent('_click'));

  it('removes the phone number when it is cleared with the keyboard', () => {
    const onSave = jest.fn();
    const { baseElement } = renderForm(onSave);

    changePhone(baseElement, '7');
    changePhone(baseElement, '');
    save(baseElement);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ channels: [{ channel: 'email', address: 'tester@test.co', verified: true }] }),
    );
  });

  it('removes the phone number when it is cleared with the clear icon', () => {
    const onSave = jest.fn();
    const { baseElement } = renderForm(onSave);

    fireEvent(
      baseElement.querySelector("goa-input[testId='contact-sms-input']"),
      new CustomEvent('_trailingIconClick'),
    );
    save(baseElement);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ channels: [{ channel: 'email', address: 'tester@test.co', verified: true }] }),
    );
  });

  it('still rejects a partial phone number', () => {
    const onSave = jest.fn();
    const { baseElement } = renderForm(onSave);

    changePhone(baseElement, '78012');
    save(baseElement);

    expect(onSave).not.toHaveBeenCalled();
  });
});
