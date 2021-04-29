import React, { useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { Page, Main } from '@components/Html';
import { fetchHealth } from '@store/health/actions';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';

function Health() {
  const dispatch = useDispatch();
  const tenant = useSelector((state: RootState) => state.tenant);
  const health = useSelector((state: RootState) => state.health);

  useEffect(() => {
    dispatch(fetchHealth(tenant.name));
  }, [tenant]);

  useEffect(() => {
    console.log('THE Health', health);
  }, [health]);

  function toggleServiceState() {
    // TODO: toggle the service state here
    // dispatch();
  }

  return (
    <Page>
      <Main>
        <h2>Health</h2>
        <p>
          The Health service allows one to easily keep monitor and receive notification if any of the child services
          experience any downtime.
        </p>

        <GoAButton onClick={toggleServiceState}>Enable Health Monitor</GoAButton>

        <section id="keycloak-user-info"></section>
      </Main>
    </Page>
  );
}

export default Health;
