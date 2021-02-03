import React from 'react';
import { Container } from 'react-bootstrap';
import useConfig from '../../utils/useConfig';

function Notifications() {

  const [config,,] = useConfig();

  return (
    <Container>
      <h2>Future notifications</h2>
      {config && `Notification Url: ${config.notificationServiceUrl}`}
    </Container>
  );
}

export default Notifications;
