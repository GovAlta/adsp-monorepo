import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { GoAButton } from '@abgov/react-components';

import Header from '../appHeader';

const LoginLanding = () => {
  const [tenantName, setTenantName] = useState<string>();
  const history = useHistory();

  return (
    <div>
      <Header hasLoginLink={false} />
      <Container>
        <Row>
          <Col></Col>
          <Col>
            <Form>
              <Form.Group controlId="tenantName">
                <Form.Label>Please enter tenant Name:</Form.Label>
                <Form.Control
                  onChange={(event): void => {
                    setTenantName(event.target.value);
                  }}
                />
              </Form.Group>

              <GoAButton
                variant="primary"
                onClick={() => {
                  history.push(`/${tenantName}/login`);
                }}
              >
                Tenant Login
              </GoAButton>
            </Form>
          </Col>
          <Col></Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginLanding;
