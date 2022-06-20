import React, { useEffect, useState } from 'react';
import { Main } from '@components/Html';
import Container from '@components/Container';
import DataTable from '@components/DataTable';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import { GoACallout } from '@abgov/react-components';
import { FetchContactInfoService } from '@store/notification/actions';
import { FetchTenantService } from '@store/tenant/actions';
import { GoAModal, GoAModalActions, GoAModalTitle } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import {
  Label,
  ContactInformationContainer,
  ContactInformationWrapper,
  CalloutWrapper,
  SubscriptionListContainer,
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
  const { subscriber } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
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
                Use this page to manage your subscriptions. Please note that you need to contact support to modify some
                subscriptions. If you have an account, sign in to manage your contact information.
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
                {contact === undefined ? (
                  <LoaderPadding>
                    <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
                  </LoaderPadding>
                ) : (
                  contact && (
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
                  )
                )}
              </>
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

const GoAModelTextWrapper = styled.div`
  padding: 0 1.5rem 0 1.75rem;
  max-width: 36rem;
`;

const LoaderPadding = styled.div`
  padding: 3rem 0;
`;
