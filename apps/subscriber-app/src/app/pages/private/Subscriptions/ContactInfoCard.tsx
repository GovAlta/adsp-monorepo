import React, { useState, useEffect } from 'react';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import { GoAFormItem } from '@abgov/react-components/experimental';
import { useDispatch, useSelector } from 'react-redux';
import { patchSubscriber, createSubscriber, VerifyEmail, CheckCode } from '@store/subscription/actions';
import { actionTypes } from '@store/subscription/models';
import { Channels } from '@store/subscription/models';
import { Grid, GridItem } from '@components/Grid';
import { SubscriberChannel, Subscriber } from '@store/subscription/models';
import { InfoCard } from './InfoCard';
import { Label, GapVS, VerificationWrapper } from './styled-components';
import { RootState } from '@store/index';
import { phoneWrapper } from '@lib/wrappers';
import { useParams } from 'react-router-dom-6';
import {
  GoAButton,
  GoAInput,
  GoAButtonGroup,
  GoARadioItem,
  GoARadioGroup,
  GoABadge,
} from '@abgov/react-components-new';
interface ContactInfoCardProps {
  subscriber?: Subscriber;
}

export const ContactInfoCard = ({ subscriber }: ContactInfoCardProps): JSX.Element => {
  const dispatch = useDispatch();
  const [formErrors, setFormErrors] = useState({});
  const userInfo = useSelector((state: RootState) => state.session?.userInfo);
  const { code } = useParams();

  const subscriberEmail = subscriber
    ? subscriber?.channels?.filter((chn: SubscriberChannel) => chn.channel === Channels.email)[0]?.address
    : userInfo?.email;

  const isEmailVerified = subscriber && subscriber?.channels?.find((c) => c.channel === Channels.email)?.verified;
  const isSmsVerified = subscriber && subscriber?.channels?.find((c) => c.channel === Channels.sms)?.verified;

  const subscriberSMS =
    subscriber?.channels?.filter((chn: SubscriberChannel) => chn.channel === Channels.sms)[0]?.address || '';

  useEffect(() => {
    setPreferredChannel(subscriber?.channels ? subscriber?.channels[0].channel : null);
  }, [subscriber]);
  // we need to wait for userInfo api call so that the followup api calls can make use of the jwt token

  useEffect(() => {
    if (code) {
      dispatch(CheckCode(code, subscriber));
    }
  }, [code]);

  const [emailContactInformation, setEmailContactInformation] = useState(subscriberEmail);
  const [SMSContactInformation, setSMSContactInformation] = useState(subscriberSMS);
  const [editContactInformation, setEditContactInformation] = useState(false);
  const [preferredChannel, setPreferredChannel] = useState(null);
  const indicator = useSelector((state: RootState) => {
    const indicator = state.session?.indicator;
    if (indicator) {
      return (
        indicator?.show &&
        indicator.action &&
        [actionTypes.updatePreference as string, actionTypes.updateContactInfo as string].includes(indicator.action)
      );
    }
    return false;
  });

  const setValue = (name: string, value: string) => {
    switch (name) {
      case Channels?.email:
        setEmailContactInformation(value);
        break;
      case Channels?.sms: {
        setSMSContactInformation(value);

        break;
      }
    }
  };
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const isValidEmail = (email: string): boolean => {
    return /^\w+(?:[.-]\w+)*@\w+(?:[.-]\w+)*(?:\.\w{2,3})+$/.test(email);
  };

  const isValidSMS = (sms: string): boolean => {
    if (sms) {
      return /^\d{10}$/.test(sms) && sms.length === 10;
    }

    // allow empty phone number
    return true;
  };

  const saveContactInformation = async () => {
    setFormErrors({});

    if (!isValidEmail(emailContactInformation)) {
      setFormErrors({ email: 'You must enter a valid email.' });
      return;
    }

    if (preferredChannel === Channels.sms && !SMSContactInformation) {
      setFormErrors({ sms: 'SMS is set as the preferred channel. A valid SMS number is required.' });
      return;
    }

    if (!isValidSMS(SMSContactInformation)) {
      setFormErrors({ sms: 'Please enter a valid 10 digit phone number ie. 7801234567.' });
      return;
    }
    let channels = [];

    if (subscriber?.channels) {
      channels = [...subscriber.channels];
    }

    const emailChannelIndex = subscriber?.channels?.findIndex((channel) => {
      return channel.channel === Channels.email;
    });

    const smsChannelIndex = subscriber?.channels?.findIndex((channel) => {
      return channel.channel === Channels.sms;
    });

    if (emailChannelIndex !== -1 && subscriber) {
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
      if (SMSContactInformation) {
        channels[smsChannelIndex].address = SMSContactInformation;
      } else {
        channels.splice(smsChannelIndex, 1);
      }
    } else {
      if (SMSContactInformation) {
        channels = [
          ...channels,
          {
            channel: Channels.sms,
            address: SMSContactInformation,
          },
        ];
      }
    }

    const index = channels.findIndex((c) => {
      return c.channel === preferredChannel;
    });
    if (index !== -1 && index !== 0) {
      const tmp = channels[index];
      channels.splice(index, 1);
      channels = [tmp, ...channels];
    }

    dispatch(patchSubscriber(channels, subscriber?.id, actionTypes.updateContactInfo));
    setEditContactInformation(!editContactInformation);
  };

  const updateContactInfoButtons = () => {
    return (
      <div>
        <GoAButtonGroup alignment="start">
          <GoAButton size="compact" testId="edit-contact-save-button" onClick={saveContactInformation}>
            Save
          </GoAButton>

          <GoAButton
            size="compact"
            type="secondary"
            testId="edit-contact-cancel-button"
            onClick={() => {
              setEditContactInformation(!editContactInformation);
              setPreferredChannel(subscriber?.channels ? subscriber?.channels[0].channel : null);
              setFormErrors({});
            }}
          >
            Cancel
          </GoAButton>
        </GoAButtonGroup>
      </div>
    );
  };

  const updateChannelPreference = (channel: string) => {
    setPreferredChannel(channel);
  };

  return (
    <InfoCard title="Contact information">
      {!indicator && (
        <div>
          {editContactInformation ? (
            <Grid>
              <GridItem md={3.5} hSpacing={1}>
                <Label>Email</Label>
                <GoAFormItem error={formErrors?.['email']}>
                  <GoAInput
                    type="email"
                    aria-label="email"
                    name="email"
                    value={emailContactInformation}
                    onChange={setValue}
                    testId="contact-email-input"
                    width="100%"
                  />
                </GoAFormItem>
              </GridItem>

              <GridItem md={3.5} hSpacing={1}>
                <Label>Phone number</Label>

                <GoAFormItem error={formErrors?.['sms']}>
                  <GoAInput
                    type="tel"
                    aria-label="sms"
                    name="sms"
                    width="100%"
                    value={SMSContactInformation}
                    testId="contact-sms-input"
                    onChange={setValue}
                    trailingIcon="close"
                    onTrailingIconClick={() => {
                      setSMSContactInformation('');
                    }}
                  />
                </GoAFormItem>
              </GridItem>

              <GridItem md={5}>
                <Label>My preferred notification channel</Label>
                <br />
                <GoARadioGroup
                  name="channel"
                  value={preferredChannel}
                  onChange={(_, value) => updateChannelPreference(value)}
                >
                  <GoARadioItem value={Channels.email} name="channel" label="Email" />

                  <GoARadioItem value={Channels.sms} name="channel" label="SMS" />
                </GoARadioGroup>
              </GridItem>
            </Grid>
          ) : (
            <div>
              <Grid>
                <GridItem md={3.5} hSpacing={1}>
                  <div data-testid="email-label">
                    <Label>Email</Label>
                    <p>
                      <VerificationWrapper>
                        {isEmailVerified !== undefined && isEmailVerified === true && (
                          <GoABadge type="success" content="Verified" />
                        )}
                        {isEmailVerified !== undefined && isEmailVerified === false && (
                          <div>
                            <GoABadge type="important" content="Not verified" />
                            <GoAButton
                              size="compact"
                              testId="verify-email"
                              onClick={() => {
                                dispatch(VerifyEmail(subscriber));
                              }}
                            >
                              Verify email
                            </GoAButton>
                          </div>
                        )}
                      </VerificationWrapper>

                      {subscriberEmail}
                    </p>{' '}
                  </div>
                </GridItem>
                <GridItem md={3.5} hSpacing={1}>
                  <div data-testid="phone-number-label">
                    <Label>Phone number</Label>
                    <p>
                      <VerificationWrapper>
                        {isSmsVerified !== undefined && isSmsVerified === true && (
                          <GoABadge type="success" content="Verified" />
                        )}
                        {isSmsVerified !== undefined && isSmsVerified === false && (
                          <div>
                            <GoABadge type="important" content="Not verified" />
                            <GoAButton
                              size="compact"
                              testId="edit-contact-button"
                              onClick={() => {
                                if (!subscriber) {
                                  dispatch(createSubscriber());
                                }
                                setEditContactInformation(!editContactInformation);
                                setEmailContactInformation(subscriberEmail);
                                setSMSContactInformation(subscriberSMS);
                                setPreferredChannel(subscriber?.channels ? subscriber?.channels[0].channel : null);
                              }}
                            >
                              Verify Phone Number
                            </GoAButton>
                          </div>
                        )}
                      </VerificationWrapper>

                      {phoneWrapper(subscriberSMS)}
                    </p>
                  </div>
                </GridItem>
                <GridItem md={5}>
                  <Label>My preferred notification channel</Label>
                  <br />
                  <GoARadioGroup
                    name="preferredChannel"
                    //eslint-disable-next-line
                    onChange={() => {}}
                    disabled={true}
                    value={preferredChannel}
                  >
                    <GoARadioItem value={Channels.email} name="preferredChannel" label="Email" />

                    <GoARadioItem value={Channels.sms} name="preferredChannel" label="SMS" />
                  </GoARadioGroup>
                </GridItem>
              </Grid>
            </div>
          )}
        </div>
      )}
      {indicator && <GoASkeletonGridColumnContent rows={5}></GoASkeletonGridColumnContent>}
      <GapVS />
      {!indicator && (
        <div>
          {editContactInformation ? (
            updateContactInfoButtons()
          ) : (
            <GoAButton
              size="compact"
              testId="edit-contact-button"
              onClick={() => {
                if (!subscriber) {
                  dispatch(createSubscriber());
                }
                setEditContactInformation(!editContactInformation);
                setEmailContactInformation(subscriberEmail);
                setSMSContactInformation(subscriberSMS);
                setPreferredChannel(subscriber?.channels ? subscriber?.channels[0].channel : null);
              }}
            >
              Edit contact information
            </GoAButton>
          )}
        </div>
      )}
    </InfoCard>
  );
};
