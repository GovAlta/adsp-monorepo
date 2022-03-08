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
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';

import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { getMySubscriberDetails, patchSubscriber, unsubscribe } from '@store/subscription/actions';
import { RootState } from '@store/index';
import SubscriptionsList from './SubscriptionsList';
import { SubscriberChannel, Subscription } from '@store/subscription/models';
import {
  NoSubscriberCallout,
  Label,
  ContactInformationContainer,
  SubscriptionListContainer,
  TableHeaders,
} from './styled-components';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const EMAIL = 'email';
  const { subscriber, hasSubscriberId } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
    hasSubscriberId: state.subscription.hasSubscriberId,
  }));
  const contact = useSelector((state: RootState) => state.notification?.contactInfo);
  const [formErrors, setFormErrors] = useState({});
  const subscriberEmail = subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === EMAIL)[0]?.address;
  const [emailContactInformation, setEmailContactInformation] = useState(subscriberEmail);
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
    dispatch(FetchContactInfoService(realm));
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
      case EMAIL:
        setEmailContactInformation(value);
        break;
    }
  };
  const unSubscribeModal = () => {
    return (
      <GoAModal isOpen={true} key={1} data-testId="unsubscribe-modal">
        <GoAModalTitle>Are you sure you want unsubscribe?</GoAModalTitle>
        <GoAModalContent data-testId="unsubscribe-modal-content">
          If you decide to unsubscribe from “{selectedUnsubscribeSub.type.name}” you won’t receive any updates from the
          service in the future.{' '}
        </GoAModalContent>
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
      if (subscriberEmail !== emailContactInformation) {
        dispatch(
          patchSubscriber(
            [
              {
                channel: EMAIL,
                address: emailContactInformation,
              },
            ],
            subscriber.id
          )
        );
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
          <p data-testid="service-description" className="pb25">
            Use this page to manage notifications from the services of Government of Alberta. Please note, unsubscribing
            from some notifications might require additional verification from the government authorities.
          </p>
          {showUnSubscribeModal ? unSubscribeModal() : ''}
          {subscriber?.subscriptions ? (
            <>
              <div className="pb35">
                <GoACard title="Contact information" data-testid="contact-information-card">
                  <Label>Email</Label>
                  <ContactInformationContainer>
                    <div>
                      {editContactInformation ? (
                        <GoAForm>
                          <GoAFormItem error={formErrors?.['email']}>
                            <GoAInputEmail
                              aria-label="email"
                              name="email"
                              value={emailContactInformation}
                              onChange={setValue}
                              data-testid="edit-contact-input-text"
                            />
                          </GoAFormItem>
                        </GoAForm>
                      ) : (
                        <p>{subscriberEmail}</p>
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
              </div>
              <GoAModal></GoAModal>
              <Container hs={0} vs={0}>
                <SubscriptionListContainer>
                  {subscriber.subscriptions?.length > 0 ? (
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
                <div id="contactSupport" className="pt2">
                  <GoACallout title="Need help? Contact your service admin" type="information">
                    <div>{contact?.supportInstructions}</div>
                    <div>
                      Email:{' '}
                      <a rel="noopener noreferrer" target="_blank" href={`mailto:${contact?.contactEmail}`}>
                        {contact?.contactEmail}
                      </a>
                    </div>
                    <div>Phone: {phoneWrapper(contact?.phoneNumber)}</div>
                    <div data-testid="service-notice-date-range"></div>
                  </GoACallout>
                </div>
              </Container>
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
  .pt2 {
    padding-top: 2rem;
  }

  .pb25 {
    padding-bottom: 2.5rem;
  }

  .pb35 {
    padding-bottom: 3.5rem;
  }

  tr > th {
    padding-bottom: 0.5rem;
  }
`;
