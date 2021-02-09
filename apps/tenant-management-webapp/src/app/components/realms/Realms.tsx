import React from 'react';
import './SignIn.css';
import { Container, Row, Col } from 'react-bootstrap';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GoAButton } from '@abgov/react-components';
import '@abgov/react-components/react-components.esm.css';

import { useHistory } from 'react-router-dom';

const Realms = () => {
  const history = useHistory();

  const onEnterCreateRealm = () => {
    history.push('/realms/CreateRealm');
  };

  return (
    <Container className="mt-5">
      <Row>
        <Col>
          <h1 style={{ fontWeight: 'bold' }}> Welcome Platformer! </h1>
          <div className="mb-5 mt-4">
            Creating and activating your own tenant requires a few steps.You
            must start by creating a tenant.Once the tenant has been created,
            you will be asked to activate the tenant.
          </div>
        </Col>
      </Row>
      <Row style={{ display: 'flex' }}>
        <Col sm={12} md={6} className="mb-">
          <div
            style={{
              padding: '25px',
              borderStyle: 'solid',
              borderColor: 'grey',
              borderWidth: '1px',
              boxShadow: '1px 2px #888888',
              height: '100%',
            }}
          >
            <h1 className="mb-3"> 1. Create Tenant </h1>
            <div className="mb-3">
              Before you start, please ensure these guidelines have been met:
            </div>
            <p className="mb-2">
              <FontAwesomeIcon
                style={{ color: 'green', margin: '0 5px 0 0' }}
                icon={faCheckCircle}
              />
              You have not created a tenant with your current account
            </p>
            <div className="mb-4">
              <FontAwesomeIcon
                style={{ color: 'green', margin: '0 5px 0 0' }}
                icon={faCheckCircle}
              />
              This is for ministry approved projects.
            </div>
            <div className="mt-5">
              <GoAButton onClick={onEnterCreateRealm}>Create Tenant</GoAButton>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Realms;
