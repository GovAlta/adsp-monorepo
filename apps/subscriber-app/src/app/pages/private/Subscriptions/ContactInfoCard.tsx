import React, { FormEvent, useState, useEffect } from 'react';
import { GoAButton, GoARadio } from '@abgov/react-components';
import { GoAInputEmail, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { useDispatch, useSelector } from 'react-redux';
import { patchSubscriber } from '@store/subscription/actions';
import { actionTypes } from '@store/subscription/models';

import { Channels } from '@store/notifications/models';
import { Grid, GridItem } from '@components/Grid';
import { SubscriberChannel, Subscriber } from '@store/subscription/models';
import { InfoCard } from './InfoCard';
import { Label } from './styled-components';
import { GapVS } from './styled-components';
import { RootState } from '@store/index';
import { IndicatorWithDelay } from '@components/Indicator';

interface ContactInfoCardProps {
  subscriber: Subscriber;
}

export const ContactInfoCard = ({ subscriber }: ContactInfoCardProps): JSX.Element => {
  const dispatch = useDispatch();
  const [formErrors, setFormErrors] = useState({});
  const subscriberEmail = subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === Channels.email)[0]
    ?.address;
  const subscriberSMS = subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === Channels.sms)[0]
    ?.address;

  const [emailContactInformation, setEmailContactInformation] = useState(subscriberEmail);
  const [SMSContactInformation, setSMSContactInformation] = useState(subscriberSMS);
  const [editContactInformation, setEditContactInformation] = useState(false);
  const preferredChannel = subscriber?.channels ? subscriber?.channels[0].channel : null;
  const indicator = useSelector((state: RootState) => {
    const indicator = state.session?.indicator;
    if (indicator) {
      return (
        indicator?.show &&
        indicator.action &&
        [actionTypes.updatePreference, actionTypes.updateContactInfo].includes(indicator.action)
      );
    }
    return false;
  });

  const setValue = (name: string, value: string) => {
    switch (name) {
      case Channels.email:
        setEmailContactInformation(value);
        break;
      case Channels.sms: {
        setSMSContactInformation(value);
        break;
      }
    }
  };
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const isValidEmail = (email: string): boolean => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  const isValidSMS = (sms: string): boolean => {
    if (sms) {
      return /^(\(\d{3}\)[.-]?|\d{3}[.-]?)?\d{3}[.-]?\d{4}$/.test(sms);
    }
    // allow empty phone number
    return true;
  };

  const sanitizeSMS = (sms: string) => {
    return sms
      .toLowerCase()
      .split('')
      .filter((c) => c >= '0' && c <= '9')
      .join('');
  };

  const saveContactInformation = async (e: FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!isValidEmail(emailContactInformation)) {
      setFormErrors({ email: 'You must enter a valid email.' });
      return;
    }

    if (preferredChannel === Channels.sms && !SMSContactInformation) {
      setFormErrors({ sms: 'SMS is the set as the preferred channel. A valid SMS number is required.' });
      return;
    }

    if (!isValidSMS(SMSContactInformation)) {
      setFormErrors({ sms: 'You must enter a valid phone number with format: 111-111-1111.' });
      return;
    }

    if (subscriber.channels) {
      const emailChannelIndex = subscriber.channels.findIndex((channel) => {
        return channel.channel === Channels.email;
      });

      const smsChannelIndex = subscriber.channels.findIndex((channel) => {
        return channel.channel === Channels.sms;
      });
      let channels = [...subscriber.channels];

      if (emailChannelIndex !== -1) {
        channels[emailChannelIndex].address = emailContactInformation;
      } else {
        channels = [
          ...channels,
          {
            channel: Channels.email,
            address: emailContactInformation,
          },
        ];
      }

      if (smsChannelIndex !== -1) {
        channels[smsChannelIndex].address = sanitizeSMS(SMSContactInformation);
      } else {
        channels = [
          ...channels,
          {
            channel: Channels.sms,
            address: sanitizeSMS(SMSContactInformation),
          },
        ];
      }

      if (subscriberEmail !== emailContactInformation || subscriberEmail !== SMSContactInformation) {
        dispatch(patchSubscriber(channels, subscriber.id, actionTypes.updateContactInfo));
      }
    }
    setEditContactInformation(!editContactInformation);
  };

  const updateContactInfoButtons = () => {
    return (
      <div>
        <GoAButton buttonSize="small" data-testid="edit-contact-save-button" onClick={saveContactInformation}>
          Save
        </GoAButton>

        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          data-testid="edit-contact-cancel-button"
          onClick={() => {
            setEditContactInformation(!editContactInformation);
            setFormErrors({});
          }}
        >
          Cancel
        </GoAButton>
      </div>
    );
  };

  const updateChannelPreference = (channel: string) => {
    let channels = [...subscriber?.channels];
    const index = channels.findIndex((c) => {
      return c.channel === channel;
    });
    if (index !== -1 && index !== 0) {
      const tmp = channels[index];
      channels.splice(index, 1);
      channels = [tmp, ...channels];
      dispatch(patchSubscriber(channels, subscriber.id, actionTypes.updatePreference));
    }
  };

  return (
    <InfoCard title="Contact information" data-testid="contact-information-card">
      <div>
        {editContactInformation ? (
          <Grid>
            <GridItem md={3.5} hSpacing={1.5}>
              <Label>Email</Label>
              <GoAFormItem error={formErrors?.['email']}>
                <GoAInputEmail
                  aria-label="email"
                  name="email"
                  value={emailContactInformation}
                  onChange={setValue}
                  data-testid="contact-email-input"
                />
              </GoAFormItem>
            </GridItem>

            <GridItem md={3.5} hSpacing={1.5}>
              <Label>SMS</Label>

              <GoAFormItem error={formErrors?.['sms']}>
                <GoAInput
                  type="text"
                  aria-label="sms"
                  name="sms"
                  value={SMSContactInformation}
                  data-testid="contact-sms-input"
                  onChange={setValue}
                  placeholder="111-111-1111"
                />
              </GoAFormItem>
            </GridItem>

            <GridItem md={5} hSpacing={1.5}>
              <Label>My primary notification channel</Label>
              <GoARadio
                key="channel-preference-email"
                value={Channels.email}
                testId="channel-preference-email-btn"
                checked={preferredChannel === Channels.email}
                onChange={updateChannelPreference}
              >
                Email
              </GoARadio>
              <GoARadio
                key="channel-preference-sms"
                value={Channels.sms}
                testId="channel-preference-sms-btn"
                checked={preferredChannel === Channels.sms}
                onChange={updateChannelPreference}
              >
                SMS
              </GoARadio>
            </GridItem>
          </Grid>
        ) : (
          <div>
            <Grid>
              <GridItem md={3.5}>
                <div>
                  <Label>Email</Label>
                  <p>{subscriberEmail}</p>
                </div>
              </GridItem>
              <GridItem md={3.5}>
                <div>
                  <Label>Phone number</Label>
                  <p>{subscriberSMS}</p>
                </div>
              </GridItem>
              <GridItem md={5}>
                <Label>My primary notification channel</Label>
                <GoARadio
                  key="channel-preference-email"
                  value={Channels.email}
                  disabled={true}
                  checked={preferredChannel === Channels.email}
                  //eslint-disable-next-line
                  onChange={() => {}}
                >
                  Email
                </GoARadio>
                <GoARadio
                  key="channel-preference-sms"
                  value={Channels.sms}
                  disabled={true}
                  checked={preferredChannel === Channels.sms}
                  //eslint-disable-next-line
                  onChange={() => {}}
                >
                  SMS
                </GoARadio>
              </GridItem>
            </Grid>
          </div>
        )}
      </div>
      {indicator && <IndicatorWithDelay pageLock={false} />}
      <GapVS />
      <div>
        {editContactInformation ? (
          updateContactInfoButtons()
        ) : (
          <GoAButton
            buttonSize="small"
            data-testid="edit-contact-button"
            onClick={() => {
              setEmailContactInformation(subscriberEmail);
              setEditContactInformation(!editContactInformation);
            }}
          >
            Edit contact information
          </GoAButton>
        )}
      </div>
    </InfoCard>
  );
};
