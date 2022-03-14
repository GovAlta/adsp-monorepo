import React, { useEffect, useState } from 'react';
import { Main } from '@components/Html';
import Container from '@components/Container';
import DataTable from '@components/DataTable';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import { GoACallout } from '@abgov/react-components';
import { FetchContactInfoService } from '@store/notification/actions';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import Header from '@components/AppHeader';
import Footer from '@components/Footer';
import GoaLogo from '../../../assets/goa-logo.svg';
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
import { getSubscriberDetails, unsubscribe } from '@store/subscription/actions';
import { RootState } from '@store/index';
import SubscriptionsList from './SubscriptionsList';
import { SubscriberChannel, Subscription } from '@store/subscription/models';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const EMAIL = 'email';
  const { subscriptions, notifications } = useSelector((state: RootState) => ({
    subscriptions: state.subscription.subscriptions,
    notifications: state.notifications.notification,
  }));

  const contact = useSelector((state: RootState) => state.notification?.contactInfo);

  const subscriberEmail =
    subscriptions?.length > 0 &&
    subscriptions[0]?.subscriber.channels?.find((chn: SubscriberChannel) => chn.channel === EMAIL)?.address;
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
    const resource = subscriptions?.length > 0 && subscriptions[0]?.tenantId?.resource;
    const resourcePieces = resource && resource.split('/');
    const tenantId = resourcePieces && resourcePieces[resourcePieces.length - 1];
    if (tenantId) dispatch(FetchContactInfoService({ tenantId: tenantId }));
  }, [subscriptions]);

  const unSubscribe = (typeId: string) => {
    setShowUnSubscribeModal(true);
    setSelectedUnsubscribeSub(subscriptions?.filter((item) => item.typeId === typeId)[0]);
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

  return (
    <>
      <Header serviceName="Alberta Digital Service Platform - Subscription management " />
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
            {subscriptions ? (
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
                  {subscriptions?.length > 0 ? (
                    <DataTable data-testid="subscriptions-table">
                      <TableHeaders>
                        <tr>
                          <th id="subscriptions">Subscriptions</th>
                          <th id="available-channels">Available channels</th>
                          <th id="action">Action</th>
                        </tr>
                      </TableHeaders>
                      <tbody>
                        <SubscriptionsList onUnsubscribe={unSubscribe} subscriptions={subscriptions} />
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
      <Footer logoSrc={GoaLogo} />
    </>
  );
};
export default Subscriptions;

const SubscriptionManagement = styled.div`
  tr > th {
    padding-bottom: 0.5rem;
  }
`;
