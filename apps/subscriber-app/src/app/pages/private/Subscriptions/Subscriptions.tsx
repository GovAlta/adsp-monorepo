import React, { FormEvent, useEffect, useState } from 'react';
import { Main } from '@components/Html';
import Container from '@components/Container';
import DataTable from '@components/DataTable';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import { GoACallout } from '@abgov/react-components';
import { FetchContactInfoService } from '@store/notification/actions';
import { useParams } from 'react-router-dom';
import {
  GoAInputEmail,
  GoAForm,
  GoAFormItem,
  GoAModal,
  GoAModalActions,
  GoAModalTitle,
  GoAInput,
} from '@abgov/react-components/experimental';

import SubscriptionsList from '@components/SubscriptionsList';

import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { getMySubscriberDetails, patchSubscriber, unsubscribe } from '@store/subscription/actions';
import { RootState } from '@store/index';
import { Channels } from '@store/notifications/models';
import { SubscriberChannel, Subscription } from '@store/subscription/models';
import {
  NoSubscriberCallout,
  Label,
  ContactInformationContainer,
  ContactInformationWrapper,
  CalloutWrapper,
  SubscriptionListContainer,
  TableHeaders,
  DescriptionWrapper,
} from './styled-components';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const { subscriber, hasSubscriberId } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
    hasSubscriberId: state.subscription.hasSubscriberId,
  }));
  const contact = useSelector((state: RootState) => state.notification?.contactInfo);
  const [formErrors, setFormErrors] = useState({});
  const subscriberEmail = subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === Channels.email)[0]
    ?.address;
  const subscriberSMS = subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === Channels.sms)[0]
    ?.address;

  const [emailContactInformation, setEmailContactInformation] = useState(subscriberEmail);
  const [SMSContactInformation, setSMSContactInformation] = useState(subscriberSMS);

  const [editContactInformation, setEditContactInformation] = useState(false);
  const [showUnSubscribeModal, setShowUnSubscribeModal] = useState(false);
  const [selectedUnsubscribeSub, setSelectedUnsubscribeSub] = useState<Subscription>();
  const { realm } = useParams<{ realm: string }>();

  const phoneWrapper = (phoneNumber) => {
    if (phoneNumber) {
      return (
        '1 (' + phoneNumber.substring(0, 3) + ') ' + phoneNumber.substring(3, 6) + '-' + phoneNumber.substring(6, 10)
      );
    }
  };
  useEffect(() => {
    dispatch(getMySubscriberDetails());
  }, []);

  useEffect(() => {
    dispatch(FetchContactInfoService({ realm }));
  }, []);

  const unSubscribe = (typeId: string) => {
    setShowUnSubscribeModal(true);
    setSelectedUnsubscribeSub(subscriber?.subscriptions.filter((item) => item.typeId === typeId)[0]);
  };
  const resetSelectedUnsubscribe = () => {
    setShowUnSubscribeModal(false);
    setSelectedUnsubscribeSub(undefined);
  };
  const setValue = (name: string, value: string) => {
    switch (name) {
      case Channels.email:
        setEmailContactInformation(value);
        break;
      case Channels.sms: {
        console.log(Channels.sms);
        setSMSContactInformation(value);
        break;
      }
    }
  };
  const unSubscribeModal = () => {
    return (
      <GoAModal isOpen={true} key={1} data-testId="unsubscribe-modal">
        <GoAModalTitle>Are you sure you want unsubscribe?</GoAModalTitle>
        <GoAModelTextWrapper data-testId="unsubscribe-modal-content">
          If you decide to unsubscribe from “{selectedUnsubscribeSub.type.name}” you won’t receive any updates from the
          service in the future.{' '}
        </GoAModelTextWrapper>
        <GoAModalActions>
          <GoAButton
            buttonType="secondary"
            data-testid="unsubscribe-modal-cancel-button"
            onClick={() => {
              resetSelectedUnsubscribe();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="unsubscribe-modal-okay-button"
            onClick={() => {
              dispatch(
                unsubscribe({
                  type: selectedUnsubscribeSub.typeId,
                  subscriberId: selectedUnsubscribeSub.subscriberId,
                })
              );
              resetSelectedUnsubscribe();
            }}
          >
            Unsubscribe
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    );
  };
  const isValidEmail = (email: string): boolean => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };
  const saveContactInformation = async (e: FormEvent) => {
    e.preventDefault();
    if (isValidEmail(emailContactInformation)) {
      setFormErrors({});

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
          channels[smsChannelIndex].address = SMSContactInformation;
        } else {
          channels = [
            ...channels,
            {
              channel: Channels.sms,
              address: SMSContactInformation,
            },
          ];
        }

        if (subscriberEmail !== emailContactInformation || subscriberEmail !== SMSContactInformation) {
          dispatch(patchSubscriber(channels, subscriber.id));
        }
      }
      setEditContactInformation(!editContactInformation);
    } else {
      setFormErrors({ email: 'You must enter a valid email' });
    }
  };
  const updateContactInfoButtons = () => {
    return (
      <div>
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
        <GoAButton buttonSize="small" data-testid="edit-contact-save-button" onClick={saveContactInformation}>
          Save
        </GoAButton>
      </div>
    );
  };
  return (
    <SubscriptionManagement>
      <Main>
        <Container hs={2} vs={4.5} xlHSpacing={12}>
          <h1 data-testid="service-name">Subscription management</h1>
          <DescriptionWrapper>
            <p data-testid="service-description">
              Use this page to manage notifications from the services of Government of Alberta. Please note,
              unsubscribing from some notifications might require additional verification from the government
              authorities.
            </p>
          </DescriptionWrapper>
          {showUnSubscribeModal ? unSubscribeModal() : ''}
          {subscriber ? (
            <>
              <ContactInformationWrapper>
                <GoACard title="Contact information" data-testid="contact-information-card">
                  <ContactInformationContainer>
                    <div>
                      {editContactInformation ? (
                        <GoAForm>
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

                          <Label>SMS</Label>
                          <GoAFormItem error={formErrors?.['sms']}>
                            <GoAInput
                              type="text"
                              aria-label="sms"
                              name="sms"
                              value={SMSContactInformation}
                              data-testid="contact-sms-input"
                              onChange={setValue}
                            />
                          </GoAFormItem>
                        </GoAForm>
                      ) : (
                        <div>
                          {subscriberEmail && <p>Email: {subscriberEmail}</p>}
                          {subscriberSMS && <p>SMS: {subscriberSMS}</p>}
                        </div>
                      )}
                    </div>
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
                  </ContactInformationContainer>
                </GoACard>
              </ContactInformationWrapper>
              <GoAModal></GoAModal>
              <SubscriptionListContainer>
                {subscriber?.subscriptions?.length > 0 ? (
                  <DataTable data-testid="subscriptions-table">
                    <TableHeaders>
                      <tr>
                        <th id="subscriptions">Subscriptions</th>
                        <th id="available-channels">Available channels</th>
                        <th id="action">Action</th>
                      </tr>
                    </TableHeaders>
                    <tbody>
                      <SubscriptionsList onUnsubscribe={unSubscribe} subscriptions={subscriber.subscriptions} />
                    </tbody>
                  </DataTable>
                ) : (
                  <GoACallout title="You have no subscriptions" type="important"></GoACallout>
                )}
              </SubscriptionListContainer>
              {contact?.contactEmail && (
                <CalloutWrapper id="contactSupport">
                  <GoACallout title="Need help? Contact your service admin" type="information">
                    <div>{contact?.supportInstructions}</div>
                    <div>
                      Email:{' '}
                      <a rel="noopener noreferrer" target="_blank" href={`mailto:${contact?.contactEmail}`}>
                        {contact?.contactEmail}
                      </a>
                    </div>
                    {contact?.phoneNumber && <div>Phone: {phoneWrapper(contact?.phoneNumber)}</div>}
                    <div data-testid="service-notice-date-range"></div>
                  </GoACallout>
                </CalloutWrapper>
              )}
            </>
          ) : hasSubscriberId === false ? (
            <NoSubscriberCallout>
              <GoACallout title="You have no subscriptions" type="important"></GoACallout>
            </NoSubscriberCallout>
          ) : (
            <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
          )}
        </Container>
      </Main>
    </SubscriptionManagement>
  );
};
export default Subscriptions;

const SubscriptionManagement = styled.div`
  tr > th {
    padding-bottom: 0.5rem;
  }
`;

const GoAModelTextWrapper = styled.div`
  padding: 0 1.5rem 0 1.75rem;
  max-width: 36rem;
`;
