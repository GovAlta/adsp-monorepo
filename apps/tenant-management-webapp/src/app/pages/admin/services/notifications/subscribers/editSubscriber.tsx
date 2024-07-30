import React, { FunctionComponent, useEffect, useState } from 'react';
import type { Subscriber } from '@store/subscription/models';
import { GoAButton, GoAButtonGroup, GoAInput, GoATextArea, GoAModal, GoAFormItem } from '@abgov/react-components-new';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { emailError, smsError } from '@lib/inputValidation';

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
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bot, setBot] = useState('');
  const [email, setEmail] = useState('');

  const updateError = useSelector((state: RootState) => state.subscription.updateError);

  useEffect(() => {
    const x = JSON.stringify(initialValue);
    setSubscriber(JSON.parse(x));
  }, [initialValue]);

  let smsIndex = getChannelIndex(subscriber, 'sms');
  let emailIndex = getChannelIndex(subscriber, 'email');
  let botIndex = getChannelIndex(subscriber, 'bot');

  useEffect(() => {
    if (subscriber && smsIndex !== -1) {
      setPhone(subscriber.channels[smsIndex].address);
    }
    if (smsIndex === -1) {
      setPhone('');
    }

    if (subscriber && emailIndex !== -1) {
      setEmail(subscriber.channels[emailIndex].address);
    }
    if (emailIndex === -1) {
      setEmail('');
    }

    setAddress(subscriber?.addressAs || '');
  }, [subscriber]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const trySave = (subscriber) => {
    let formErrorList = {};
    if (emailIndex !== -1) {
      formErrorList = Object.assign(formErrorList, emailError(email));
    }
    let phoneIndex = smsIndex;
    if (smsIndex === -1) {
      phoneIndex = subscriber?.channels ? subscriber?.channels?.length : 0;
    }

    const channels = subscriber?.channels || [];

    formErrorList = Object.assign(formErrorList, smsError(phone));
    if (Object.keys(formErrorList).length === 0) {
      if (smsIndex === -1 && email) {
        if (phone.length !== 0) {
          channels.push({ channel: 'sms', address: phone, verified: false });
        }
      } else {
        if (phone.length === 0) {
          channels.splice(smsIndex);
          emailIndex = getChannelIndex(subscriber, 'email');
          botIndex = getChannelIndex(subscriber, 'bot');
        } else {
          channels[phoneIndex].address = phone;
        }
      }

      if (emailIndex === -1) {
        if (email.length !== 0) {
          channels.push({ channel: 'email', address: email, verified: false });
        }
      } else {
        if (email.length === 0) {
          channels.splice(emailIndex);
          smsIndex = getChannelIndex(subscriber, 'sms');
          botIndex = getChannelIndex(subscriber, 'bot');
        } else {
          channels[emailIndex].address = email;
        }
      }

      if (botIndex === -1) {
        if (bot.length !== 0) {
          channels.push({ channel: 'bot', address: bot, verified: false });
        }
      } else {
        if (bot.length === 0) {
          channels.splice(botIndex);
          smsIndex = getChannelIndex(subscriber, 'sms');
          emailIndex = getChannelIndex(subscriber, 'email');
        } else {
          channels[botIndex].address = bot;
        }
      }

      setFormErrors(null);
      if (subscriber?.addressAs != null) {
        subscriber.addressAs = address;
      }

      onSave({ ...subscriber, channels: channels });
    } else {
      setFormErrors(formErrorList);
    }
  };

  const tryCancel = () => {
    setFormErrors(null);
    onCancel();
  };

  return (
    <EditStyles>
      <GoAModal
        testId="notification-types-form"
        open={open}
        heading="Edit subscriber"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton testId="form-cancel" type="secondary" onClick={tryCancel}>
              Cancel
            </GoAButton>
            <GoAButton type="primary" testId="form-save" onClick={() => trySave(subscriber)}>
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <ErrorWrapper>
          <GoAFormItem error={formErrors?.['name']} label="Address as">
            <GoAInput
              type="text"
              name="name"
              width="100%"
              value={address}
              testId="form-name"
              aria-label="name"
              onChange={(_name, value) => setAddress(value)}
            />
          </GoAFormItem>
          <GoAFormItem error={formErrors?.['email'] || updateError} label="Email">
            <GoAInput
              type="email"
              name="email"
              width="100%"
              testId="form-email"
              value={email}
              aria-label="email"
              onChange={(_name, value) => {
                setEmail(value);
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={formErrors?.['sms'] || updateError} label="Phone number">
            <div className="phoneInputStyle">
              <GoAInput
                type="tel"
                aria-label="sms"
                name="sms"
                width="100%"
                value={phone}
                testId="contact-sms-input"
                onChange={(_, value) => {
                  if (value) setPhone(value);
                }}
                trailingIcon="close"
                onTrailingIconClick={() => {
                  setPhone('');
                }}
              />
            </div>
          </GoAFormItem>

          {botIndex !== -1 && (
            <GoAFormItem error={formErrors?.['slack'] || updateError} label="Slack">
              <GoATextArea
                name="slack"
                testId="form-slack"
                value={bot}
                aria-label="slack"
                width="100%"
                onKeyPress={(name, value, key) => {
                  setBot(value);
                }}
                // eslint-disable-next-line
                onChange={(name, value) => {}}
              />
            </GoAFormItem>
          )}
        </ErrorWrapper>
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

  .phoneInputStyle > input {
    border-radius: 3px;
    border-width: 1px !important;
    border: solid;
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
