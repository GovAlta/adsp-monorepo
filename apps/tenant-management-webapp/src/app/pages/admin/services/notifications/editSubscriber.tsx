import React, { FunctionComponent, useEffect, useState } from 'react';
import type { Subscriber } from '@store/subscription/models';
import { GoAButton } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import InputMask from 'react-input-mask';

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
  const [prettyPhone, setPrettyPhone] = useState(null);

  const updateError = useSelector((state: RootState) => state.subscription.updateError);

  useEffect(() => {
    const x = JSON.stringify(initialValue);
    setSubscriber(JSON.parse(x));
  }, [initialValue]);

  const smsIndex = getChannelIndex(subscriber, 'sms');

  useEffect(() => {
    if (open && subscriber) {
      setPrettyPhone('1' + subscriber.channels[smsIndex].address);
    }
  }, [open, subscriber]);

  function emailErrors(email) {
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return { email: 'You must enter a valid email' };
    }
  }

  function phoneError(phone) {
    if (!/^\d{10}$/.test(phone) && phone.length !== 0) {
      return { sms: 'Please enter a valid phone number ie. 1 (780) 123-4567' };
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
    let formErrorList = {};
    if (emailIndex !== -1) {
      formErrorList = Object.assign(formErrorList, emailErrors(subscriber.channels[emailIndex].address));
    }
    if (smsIndex !== -1) {
      const cleanNumber = prettyPhone.replace(/[- )(]/g, '').slice(1);
      formErrorList = Object.assign(formErrorList, phoneError(cleanNumber));
    }
    if (Object.keys(formErrorList).length === 0) {
      if (smsIndex !== -1) {
        const cleanNumber = prettyPhone.replace(/[- )(]/g, '').slice(1);
        subscriber.channels[smsIndex].address = cleanNumber;
      }
      onSave(subscriber);
    } else {
      setFormErrors(formErrorList);
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
              {smsIndex !== -1 && (
                <GoAFormItem error={formErrors?.['sms'] || updateError}>
                  <label>Phone number</label>
                  <InputMask
                    name="phoneNumber"
                    value={prettyPhone}
                    placeholder="1 (780) 123-4567"
                    mask="1\ (999) 999-9999"
                    maskChar={null}
                    data-testid="form-phone-number"
                    aria-label="name"
                    onChange={(e) => {
                      setPrettyPhone(e.target.value);
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
