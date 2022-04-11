import React, { FunctionComponent, useEffect, useState } from 'react';
import type { Subscriber } from '@store/subscription/models';
import { GoAButton } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import styled from 'styled-components';

interface NotificationTypeFormProps {
  initialValue?: Subscriber;
  onCancel?: () => void;
  onSave?: (type: Subscriber) => void;
  open: boolean;
  errors?: Record<string, string>;
}

export const SubscriberModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
}) => {
  const x = JSON.stringify(initialValue);
  const [subscriber, setSubscriber] = useState(JSON.parse(x));
  const [formErrors, setFormErrors] = useState(null);

  const updateError = useSelector((state: RootState) => state.subscription.updateError);

  useEffect(() => {
    const x = JSON.stringify(initialValue);
    setSubscriber(JSON.parse(x));
  }, [initialValue]);

  function emailErrors(email) {
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return { email: 'You must enter a valid email' };
    }
  }

  function getChannelIndex(subscriber, type) {
    const channels = subscriber?.channels;
    if (channels) {
      for (let i = channels.length - 1; i >= 0; i--) {
        // Fetch the index of the last email
        if (channels[i].channel === type) {
          return i;
        }
      }
    }
    return -1;
  }

  const emailIndex = getChannelIndex(subscriber, 'email');
  const slackIndex = getChannelIndex(subscriber, 'slack');

  const trySave = (subscriber) => {
    const emailIndex = getChannelIndex(subscriber, 'email');

    if (emailIndex !== -1) {
      const formErrorList = emailErrors(subscriber.channels[emailIndex].address);
      if (!formErrorList) {
        onSave(subscriber);
      } else {
        setFormErrors(formErrorList);
      }
    } else {
      // TODO: need to add validation for slack and sms channels.
      onSave(subscriber);
    }
  };

  const tryCancel = () => {
    const x = JSON.stringify(initialValue);
    setSubscriber(JSON.parse(x));
    setFormErrors(null);
    onCancel();
  };

  return (
    <EditStyles>
      <GoAModal testId="notification-types-form" isOpen={open}>
        <GoAModalTitle>Edit subscriber</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <ErrorWrapper>
              <GoAFormItem error={formErrors?.['name']}>
                <label>Address as</label>
                <input
                  type="text"
                  name="name"
                  value={subscriber?.addressAs || ''}
                  data-testid="form-name"
                  aria-label="name"
                  onChange={(e) => setSubscriber({ ...subscriber, addressAs: e.target.value })}
                />
              </GoAFormItem>
              {emailIndex !== -1 && (
                <GoAFormItem error={formErrors?.['email'] || updateError}>
                  <label>Email</label>
                  <textarea
                    name="email"
                    data-testid="form-email"
                    value={subscriber?.channels[emailIndex].address || ''}
                    aria-label="email"
                    onChange={(e) => {
                      const channel = subscriber.channels;
                      channel[emailIndex].address = e.target.value;
                      setSubscriber({ ...subscriber, channels: channel });
                    }}
                  />
                </GoAFormItem>
              )}

              {slackIndex !== -1 && (
                <GoAFormItem error={formErrors?.['slack'] || updateError}>
                  <label>Slack</label>
                  <textarea
                    name="slack"
                    data-testid="form-slack"
                    value={subscriber?.channels[slackIndex].address || ''}
                    aria-label="slack"
                    onChange={(e) => {
                      const channel = subscriber.channels;
                      channel[slackIndex].address = e.target.value;
                      setSubscriber({ ...subscriber, channels: channel });
                    }}
                  />
                </GoAFormItem>
              )}
            </ErrorWrapper>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton data-testid="form-cancel" buttonType="secondary" type="button" onClick={tryCancel}>
            Cancel
          </GoAButton>
          <GoAButton buttonType="primary" data-testid="form-save" type="submit" onClick={(e) => trySave(subscriber)}>
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </EditStyles>
  );
};

const EditStyles = styled.div`
  ul {
    margin-left: 0;
  }

  li {
    border: 1px solid #f1f1f1;
  }
`;

export const ErrorWrapper = styled.div`
  .goa-state--error {
    input,
    textarea {
      border-color: var(--color-red);
    }
  }
`;
