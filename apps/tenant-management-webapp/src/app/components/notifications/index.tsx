import React from 'react';
import { Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

function Notifications() {

  const notificationServiceUrl = useSelector((state: RootState) => state.config.serviceUrls.notificationServiceUrl)

  return (
    <Container>
      <h2>Future notifications</h2>
      {notificationServiceUrl && `Notification Url: ${notificationServiceUrl}`}
    </Container>
  );
}

export default Notifications;
