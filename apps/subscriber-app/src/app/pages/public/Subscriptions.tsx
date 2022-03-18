import React, { useEffect, useState } from 'react';
import { Main } from '@components/Html';
import Container from '@components/Container';
import DataTable from '@components/DataTable';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import { GoACallout } from '@abgov/react-components';
import { FetchContactInfoService } from '@store/notification/actions';
import { FetchTenantService } from '@store/tenant/actions';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import {
  Label,
  ContactInformationContainer,
  ContactInformationWrapper,
  CalloutWrapper,
  SubscriptionListContainer,
  TableHeaders,
  DescriptionWrapper,
} from '../private/Subscriptions/styled-components';

import { useParams } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { getSubscriberDetails, signedOutUnsubscribe } from '@store/subscription/actions';
import { RootState } from '@store/index';
import SubscriptionsList from '@components/SubscriptionsList';
import { SubscriberChannel, Subscription } from '@store/subscription/models';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const EMAIL = 'email';
  const { subscriber, notifications } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
    notifications: state.notifications.notification,
    tenant: state.tenant,
  }));

  const contact = useSelector((state: RootState) => state.notification?.contactInfo);

  const subscriberEmail = subscriber?.channels.find((chn: SubscriberChannel) => chn.channel === EMAIL)?.address;
  const [showUnSubscribeModal, setShowUnSubscribeModal] = useState(false);
  const [selectedUnsubscribeSub, setSelectedUnsubscribeSub] = useState<Subscription>();
  const subscriberId = useParams<{ subscriberId: string }>().subscriberId;

  const phoneWrapper = (phoneNumber) => {
    if (phoneNumber) {
      return (
        '1 (' + phoneNumber.substring(0, 3) + ') ' + phoneNumber.substring(3, 6) + '-' + phoneNumber.substring(6, 10)
      );
    }
  };
  useEffect(() => {
    dispatch(getSubscriberDetails(subscriberId));
  }, []);

  useEffect(() => {
    const tenantId = subscriber?.tenantId?.split('/').pop();
    if (tenantId) {
      dispatch(FetchContactInfoService({ tenantId: tenantId }));
      dispatch(FetchTenantService({ tenantId: tenantId }));
    }
  }, [subscriber]);

  const unSubscribe = (typeId: string) => {
    setShowUnSubscribeModal(true);
    setSelectedUnsubscribeSub(subscriber?.subscriptions.filter((item) => item.typeId === typeId)[0]);
  };
  const resetSelectedUnsubscribe = () => {
    setShowUnSubscribeModal(false);
    setSelectedUnsubscribeSub(undefined);
  };

  const unSubscribeModal = () => {
    return (
      <GoAModal isOpen={true} key={1} data-testId="unsubscribe-modal">
        <GoAModalTitle>Are you sure you want unsubscribe?</GoAModalTitle>
        <GoAModalContent data-testId="unsubscribe-modal-content">
          If you decide to unsubscribe from “{selectedUnsubscribeSub?.type?.name}” you won’t receive any updates from
          the service in the future.{' '}
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
                signedOutUnsubscribe({
                  type: selectedUnsubscribeSub.typeId,
                  subscriberId: selectedUnsubscribeSub.subscriberId,
                  tenantId: subscriber?.tenantId,
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

  return (
    <>
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
                    <Label>Email</Label>
                    <ContactInformationContainer>
                      <div>
                        <p>{subscriberEmail}</p>
                      </div>
                    </ContactInformationContainer>
                  </GoACard>
                </ContactInformationWrapper>
                <GoAModal></GoAModal>
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
                <CalloutWrapper id="contactSupport">
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
                </CalloutWrapper>
              </>
            ) : notifications ? (
              <GoACallout title={`${notifications.message}`} type="important"></GoACallout>
            ) : (
              <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
            )}
          </Container>
        </Main>
      </SubscriptionManagement>
    </>
  );
};
export default Subscriptions;

const SubscriptionManagement = styled.div`
  tr > th {
    padding-bottom: 0.5rem;
  }
`;
