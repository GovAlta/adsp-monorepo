import { GoAButton } from '@abgov/react-components';
import { Page, Main } from '@components/Html';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

function Health() {
  const dispatch = useDispatch();

  useEffect(() => {
    // TODO: fetch the service's current status
  }, [dispatch]);

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
