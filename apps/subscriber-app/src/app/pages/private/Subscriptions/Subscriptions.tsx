import React, { useEffect } from 'react';

import { Main, Page } from '@components/Html';
import Container from '@components/Container';
import styled from 'styled-components';
import { GoAButton, GoACard, GoAPageLoader } from '@abgov/react-components';
import DataTable from '@components/DataTable';

import { useDispatch, useSelector } from 'react-redux';
import { getSubsciptionTypes } from '@store/subscription/actions';
import { RootState } from '@store/index';
import SubscriptionsList from './SubscriptionsList';
// import { useParams } from 'react-router-dom';
// import { TenantLogin } from '@store/tenant/actions';
// import { RootState } from '@store/index';

const Subscriptions = (): JSX.Element => {
  const dispatch = useDispatch();
  const { subscriptions } = useSelector((state: RootState) => ({
    subscriptions: state.subscription,
  }));
  console.log('subscriptions', subscriptions);
  useEffect(() => {
    dispatch(getSubsciptionTypes());
  }, []);

  return subscriptions.subscriptionTypes ? (
    <main>
      <Container hs={2} vs={4} xlHSpacing={12}>
        <h2 data-testid="service-name">Subscription preferences</h2>
        <div>
          Use this page to manage notifications from the services of Government of Alberta. Please note, unsubscribing
          from some notifications might require additional verification from the government authorities.
        </div>
        <Container hs={1} vs={5}>
          <GoACard title="Contact information" content={<span>test</span>}></GoACard>
          <SubscriptionDetailsContainer>
            <DataTable data-testid="subscriptions-table">
              <TableHeaders>
                <tr>
                  <th id="subscriptions">Subscriptions</th>
                  <th id="available-channels">Available channels</th>
                  <th id="action">Action</th>
                </tr>
              </TableHeaders>
              <tbody>
                <SubscriptionsList subscriptionTypes={subscriptions.subscriptionTypes} />
              </tbody>
            </DataTable>
          </SubscriptionDetailsContainer>
        </Container>
      </Container>
    </main>
  ) : (
    <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
  );
};
export default Subscriptions;

const SubscriptionDetailsContainer = styled.div`
  padding-top: 5rem;
`;

const TableHeaders = styled.thead`
  #action {
    text-align: right;
  }
`;
