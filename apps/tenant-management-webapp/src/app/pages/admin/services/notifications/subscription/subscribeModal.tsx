import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabModal,
  GoabRadioGroup,
  GoabRadioItem,
} from '@abgov/react-components';
import {
  GoabDropdownOnChangeDetail,
  GoabInputOnChangeDetail,
  GoabRadioGroupOnChangeDetail,
} from '@abgov/ui-components-common';
import { RootState } from '@store/index';
import type { Subscriber } from '@store/subscription/models';
import { CreateTypeSubscription, FindSubscribers, ResetTypeSubscriptionCreation } from '@store/subscription/actions';
import { emailError, smsError } from '@lib/inputValidation';

interface SubscribeModalProps {
  open: boolean;
  onCancel: () => void;
}

type SubscriberMode = 'existing' | 'new';

interface FormErrors {
  typeId?: string;
  subscriberId?: string;
  name?: string;
  email?: string;
  sms?: string;
  channels?: string;
}

export const SubscribeModal: FunctionComponent<SubscribeModalProps> = ({ open, onCancel }) => {
  const dispatch = useDispatch();
  const notificationTypes = useSelector((state: RootState) => ({
    ...state.notification.core,
    ...state.notification.notificationTypes,
  }));
  const subscribers = useSelector((state: RootState) =>
    (state.subscription.subscriberSearch.results || [])
      .map((id) => state.subscription.subscribers[id])
      .filter((subscriber): subscriber is Subscriber => !!subscriber),
  );
  const creationState = useSelector((state: RootState) => state.subscription.subscriptionCreation.state);

  const [typeId, setTypeId] = useState('');
  const [mode, setMode] = useState<SubscriberMode>('existing');
  const [subscriberId, setSubscriberId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedSubscriber = subscribers.find((subscriber) => subscriber.id === subscriberId);

  useEffect(() => {
    if (open) {
      dispatch(ResetTypeSubscriptionCreation());
      dispatch(FindSubscribers({ reset: true, top: 5000 }));
      setTypeId('');
      setMode('existing');
      setSubscriberId('');
      setName('');
      setEmail('');
      setPhone('');
      setErrors({});
    }
  }, [dispatch, open]);

  useEffect(() => {
    if (creationState === 'succeeded') {
      onCancel();
      dispatch(ResetTypeSubscriptionCreation());
    }
  }, [creationState, dispatch, onCancel]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!typeId) nextErrors.typeId = 'Select a notification type';

    if (mode === 'existing') {
      if (!subscriberId) nextErrors.subscriberId = 'Select a subscriber';
    } else {
      if (!name.trim()) nextErrors.name = 'Enter a name';
      if (!email && !phone) nextErrors.channels = 'Enter an email address or phone number';
      if (email) Object.assign(nextErrors, emailError(email));
      if (phone) Object.assign(nextErrors, smsError(phone));
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const subscribe = () => {
    if (!validate()) return;

    if (mode === 'existing') {
      if (selectedSubscriber) {
        dispatch(CreateTypeSubscription(typeId, { id: selectedSubscriber.id }));
      }
      return;
    }

    const channels = [];
    if (email) channels.push({ channel: 'email', address: email, verified: false });
    if (phone) channels.push({ channel: 'sms', address: phone, verified: false });
    dispatch(CreateTypeSubscription(typeId, { addressAs: name.trim(), channels }));
  };

  return (
    <GoabModal
      open={open}
      heading="Subscribe to a notification"
      testId="create-subscription-modal"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact" type="secondary" testId="subscription-cancel" onClick={onCancel}>
            Cancel
          </GoabButton>
          <GoabButton
            size="compact"
            type="primary"
            testId="subscription-submit"
            disabled={creationState === 'loading'}
            onClick={subscribe}
          >
            Subscribe
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem label="Notification type" error={errors.typeId} mb="m">
        <GoabDropdown
          size="compact"
          name="notificationType"
          value={typeId}
          width="100%"
          testId="subscription-type"
          onChange={(detail: GoabDropdownOnChangeDetail) => setTypeId(detail.value)}
        >
          {Object.values(notificationTypes)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((type) => (
              <GoabDropdownItem key={type.id} value={type.id} label={type.name} />
            ))}
        </GoabDropdown>
      </GoabFormItem>

      <GoabFormItem label="Subscriber" mb="m">
        <GoabRadioGroup
          name="subscriberMode"
          value={mode}
          orientation="horizontal"
          testId="subscriber-mode"
          onChange={(detail: GoabRadioGroupOnChangeDetail) => setMode(detail.value as SubscriberMode)}
        >
          <GoabRadioItem name="subscriberMode" value="existing" label="Existing subscriber" />
          <GoabRadioItem name="subscriberMode" value="new" label="New subscriber" />
        </GoabRadioGroup>
      </GoabFormItem>

      {mode === 'existing' ? (
        <>
          <GoabFormItem label="Existing subscriber" error={errors.subscriberId} mb="m">
            <GoabDropdown
              size="compact"
              name="subscriber"
              value={subscriberId}
              width="100%"
              testId="existing-subscriber"
              onChange={(detail: GoabDropdownOnChangeDetail) => setSubscriberId(detail.value)}
            >
              {subscribers
                .sort((a, b) => (a.addressAs || '').localeCompare(b.addressAs || ''))
                .map((subscriber) => (
                  <GoabDropdownItem
                    key={subscriber.id}
                    value={subscriber.id}
                    label={`${subscriber.addressAs || 'Unnamed'} (${subscriber.channels
                      .map(({ address }) => address)
                      .join(', ')})`}
                  />
                ))}
            </GoabDropdown>
          </GoabFormItem>
          {selectedSubscriber && (
            <GoabFormItem label="Available contact information" mb="m">
              {selectedSubscriber.channels.map(({ channel, address }) => (
                <div key={`${channel}:${address}`}>{`${channel}: ${address}`}</div>
              ))}
            </GoabFormItem>
          )}
        </>
      ) : (
        <>
          <GoabFormItem label="Name / address as" error={errors.name} mb="m">
            <GoabInput
              size="compact"
              name="subscriberName"
              value={name}
              width="100%"
              testId="new-subscriber-name"
              onChange={(detail: GoabInputOnChangeDetail) => setName(detail.value)}
            />
          </GoabFormItem>
          <GoabFormItem label="Email address" error={errors.email || errors.channels} mb="m">
            <GoabInput
              size="compact"
              type="email"
              name="subscriberEmail"
              value={email}
              width="100%"
              testId="new-subscriber-email"
              onChange={(detail: GoabInputOnChangeDetail) => setEmail(detail.value)}
            />
          </GoabFormItem>
          <GoabFormItem label="Phone number" error={errors.sms || (!email ? errors.channels : undefined)} mb="m">
            <GoabInput
              size="compact"
              type="tel"
              name="subscriberPhone"
              value={phone}
              width="100%"
              testId="new-subscriber-phone"
              onChange={(detail: GoabInputOnChangeDetail) => setPhone(detail.value)}
            />
          </GoabFormItem>
        </>
      )}
    </GoabModal>
  );
};
