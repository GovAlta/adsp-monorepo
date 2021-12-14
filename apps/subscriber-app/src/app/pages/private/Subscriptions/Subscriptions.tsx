import React, { useEffect } from 'react';

import { Main } from '@components/Html';
import Container from '@components/Container';
import styled from 'styled-components';
import DataTable from '@components/DataTable';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';

import { useDispatch, useSelector } from 'react-redux';
import { getMySubscriberDetails } from '@store/subscription/actions';
import { RootState } from '@store/index';
import SubscriptionsList from './SubscriptionsList';
import { SubscriberChannel } from '@store/subscription/models';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const { subscriber } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
  }));
  const subscriberEmail = subscriber?.channels.filter((chn: SubscriberChannel) => chn.channel === 'email')[0]?.address;
  useEffect(() => {
    dispatch(getMySubscriberDetails());
  }, []);

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
        <GoACard title="Contact information" data-testid="contact-information">
          <Label>Email</Label>
          <ContactInformationContainer>
            <div>
              <p>{subscriberEmail}</p>
            </div>
            <div>
              <GoAButton buttonSize="small" data-testid="edit-contact">
                Edit contact information
              </GoAButton>
            </div>
          </ContactInformationContainer>
        </GoACard>
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
                <SubscriptionsList subscriptions={subscriber.subscriptions} />
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
  #available-channels {
    text-align: center;
  }
`;
