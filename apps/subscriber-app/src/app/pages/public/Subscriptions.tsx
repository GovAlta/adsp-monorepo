import React, { FormEvent, useEffect, useState } from 'react';
import { Main } from '@components/Html';
import Container from '@components/Container';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import { GoACallout } from '@abgov/react-components';
import { FetchNotificationTypeService } from '@store/notification/actions';
import {
  GoAInputEmail,
  GoAForm,
  GoAFormItem,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';

import { useParams } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { getSubscriberDetails, patchSubscriber, unsubscribe } from '@store/subscription/actions';
import { RootState } from '@store/index';
import SubscriptionsList from './SubscriptionsList';
import { SubscriberChannel, Subscription } from '@store/subscription/models';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const EMAIL = 'email';
  const { subscriptions } = useSelector((state: RootState) => ({
    //subscriber: state.subscription.subscriber,
    subscriptions: state.subscription.subscriptions,
  }));
  const contact = useSelector((state: RootState) => state.notification.notificationTypes?.contact);
  const [formErrors, setFormErrors] = useState({});
  const subscriberEmail =
    subscriptions?.length > 0 &&
    subscriptions[0]?.subscriber.channels?.filter((chn: SubscriberChannel) => chn.channel === EMAIL)[0]?.address;
  const [emailContactInformation, setEmailContactInformation] = useState(subscriberEmail);
  const [editContactInformation, setEditContactInformation] = useState(false);
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
    dispatch(FetchNotificationTypeService());
  }, []);

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
  const isValidEmail = (email: string): boolean => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  return subscriptions ? (
    <Main>
      <Container hs={2} vs={4} xlHSpacing={12}>
        <h1 data-testid="service-name">Subscription management</h1>
        <p data-testid="service-description">Manage your subscription preferences</p>
        <p>{JSON.stringify(subscriptions)}</p>
        <br />
        <br />
        {showUnSubscribeModal ? unSubscribeModal() : ''}
        <GoACard title="Contact information" data-testid="contact-information-card">
          <Label>Email</Label>
          <ContactInformationContainer>
            <div>
              <p>{subscriberEmail}</p>
            </div>
          </ContactInformationContainer>
        </GoACard>
        <GoAModal></GoAModal>
        <Container hs={1} vs={5}>
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
          <div id="contactSupport">
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
      </Container>
    </Main>
  ) : (
    <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
  );
};
export default Subscriptions;

const Label = styled.label`
  font-weight: bold;
`;
const ContactInformationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding-top: 1.5rem;
`;
const SubscriptionListContainer = styled.div`
  padding-top: 5rem;
`;

const TableHeaders = styled.thead`
  #action {
    text-align: right;
  }
`;
