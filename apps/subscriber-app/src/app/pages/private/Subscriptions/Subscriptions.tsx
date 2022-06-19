import React, { useEffect, useState } from 'react';
import { Main } from '@components/Html';
import Container from '@components/Container';
import DataTable from '@components/DataTable';
import { GoAButton } from '@abgov/react-components';
import { GoACallout } from '@abgov/react-components';
import { FetchContactInfoService } from '@store/notification/actions';
import { useParams } from 'react-router-dom';
import { GoAModal, GoAModalActions, GoAModalTitle } from '@abgov/react-components/experimental';

import SubscriptionsList from '@components/SubscriptionsList';

import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { getMySubscriberDetails, unsubscribe } from '@store/subscription/actions';
import { RootState } from '@store/index';
import { Subscription } from '@store/subscription/models';
import {
  NoSubscriberCallout,
  ContactInformationWrapper,
  CalloutWrapper,
  SubscriptionListContainer,
  DescriptionWrapper,
} from './styled-components';
import { phoneWrapper } from '@lib/wrappers';
import { ContactInfoCard } from './ContactInfoCard';
import { IndicatorWithDelay } from '@components/Indicator';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const { subscriber, hasSubscriberId } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
    hasSubscriberId: state.subscription.hasSubscriberId,
  }));
  const contact = useSelector((state: RootState) => state.notification?.contactInfo);
  const [showUnSubscribeModal, setShowUnSubscribeModal] = useState(false);
  const [selectedUnsubscribeSub, setSelectedUnsubscribeSub] = useState<Subscription>();
  const { realm } = useParams<{ realm: string }>();

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

  return (
    <SubscriptionManagement>
      <Main>
        <Container hs={2} vs={4.5} xlHSpacing={12}>
          <h1 data-testid="service-name">Subscription management</h1>
          <DescriptionWrapper>
            <p data-testid="service-description">
              Use this page to manage your contact information and subscriptions. Please note that you need to contact
              support to modify some subscriptions.
            </p>
          </DescriptionWrapper>
          {showUnSubscribeModal ? unSubscribeModal() : ''}
          {subscriber ? (
            <>
              <ContactInformationWrapper>
                <ContactInfoCard subscriber={subscriber} />
              </ContactInformationWrapper>

              <SubscriptionListContainer>
                {subscriber?.subscriptions?.length > 0 ? (
                  <DataTable data-testid="subscriptions-table">
                    <tr>
                      <th id="subscriptions">Subscriptions</th>
                      <th id="descriptions">Subscription Details</th>
                      <th id="available-channels">Available channels</th>
                      <th id="action">Action</th>
                    </tr>
                    <tbody>
                      <SubscriptionsList onUnsubscribe={unSubscribe} subscriber={subscriber} />
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
            <IndicatorWithDelay pageLock={false} />
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
