import React, { useEffect } from 'react';

import { Main, Page } from '@components/Html';
import Container from '@components/Container';
import styled from 'styled-components';
import { GoACard } from '@abgov/react-components';
import DataTable from '@components/DataTable';

// import { useDispatch, useSelector } from 'react-redux';
// import { useParams } from 'react-router-dom';
// import { TenantLogin } from '@store/tenant/actions';
// import { RootState } from '@store/index';

const Subscriptions = (): JSX.Element => {
  // const realm = useParams<{ realm: string }>().realm;
  // const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);

  // const dispatch = useDispatch();

  useEffect(() => {
    // if (realm) {
    //   dispatch(TenantLogin(realm));
    // }
  }, []);

  return (
    <Container>
      <main>
        <h2 data-testid="service-name">Subscription preferences</h2>
        <p>
          Use this page to manage notifications from the services of Government of Alberta. Please note, unsubscribing
          from some notifications might require additional verification from the government authorities.
        </p>
        <GoACard title="subscriptions" content={<div>test</div>}></GoACard>
        <DataTable data-testid="file-type-table">
          <thead>
            <tr>
              <th id="Subscriptions">Subscriptions</th>
              <th id="Available-channels">Available channels</th>
              <th id="Action">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Health check status</th>
              <th>Health check status</th>
              <th>Unsubscribe</th>
            </tr>
          </tbody>
        </DataTable>
      </main>
    </Container>
  );
};
export default Subscriptions;
