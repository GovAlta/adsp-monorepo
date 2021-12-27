import React, { useEffect, useState } from 'react';

import { Main } from '@components/Html';
import Container from '@components/Container';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import {
  GoAInput,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';

import { useDispatch, useSelector } from 'react-redux';
import { getMySubscriberDetails, patchSubscriber, unsubscribe } from '@store/subscription/actions';
import { RootState } from '@store/index';
import SubscriptionsList from './SubscriptionsList';
import { SubscriberChannel, Subscription } from '@store/subscription/models';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const EMAIL = 'email';
  const { subscriber } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
  }));
  const subscriberEmail = subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === EMAIL)[0]?.address;
  const [emailContactInformation, setEmailContactInformation] = useState(subscriberEmail);
  const [editContactInformation, setEditContactInformation] = useState(false);
  const [showUnSubscribeModal, setShowUnSubscribeModal] = useState(false);
  const [selectedUnsubscribeSub, setSelectedUnsubscribeSub] = useState<Subscription>();

  useEffect(() => {
    dispatch(getMySubscriberDetails());
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
      <GoAModal isOpen={true} key={1} testId="unsubscribe-modal">
        <GoAModalTitle>Are you sure you want unsubscribe?</GoAModalTitle>
        <GoAModalContent testId="unsubscribe-modal-content">
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
  const updateContactInfoButtons = () => {
    return (
      <div>
        <GoAButton
          buttonSize="small"
          buttonType="secondary"
          data-testid="edit-contact-cancel-button"
          onClick={() => {
            setEditContactInformation(!editContactInformation);
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          buttonSize="small"
          data-testid="edit-contact-save-button"
          onClick={async () => {
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
          }}
        >
          Save
        </GoAButton>
      </div>
    );
  };
  return subscriber?.subscriptions ? (
    <Main>
      <Container hs={2} vs={4} xlHSpacing={12}>
        <h1 data-testid="service-name">Subscription management</h1>
        <p data-testid="service-description">
          Use this page to manage notifications from the services of Government of Alberta. Please note, unsubscribing
          from some notifications might require additional verification from the government authorities.
        </p>
        <br />
        <br />
        {showUnSubscribeModal ? unSubscribeModal() : ''}
        <GoACard title="Contact information" data-testid="contact-information-card">
          <Label>Email</Label>
          <ContactInformationContainer>
            <div>
              {editContactInformation ? (
                <GoAInput
                  aria-label="email"
                  name="email"
                  input="text"
                  value={emailContactInformation}
                  onChange={setValue}
                  test-id="edit-contact-input-text"
                />
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
        <GoAModal></GoAModal>
        <Container hs={1} vs={5}>
          <SubscriptionListContainer>
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
          </SubscriptionListContainer>
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
