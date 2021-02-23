import React, { useState } from 'react';
import Header from '../../header';
import { useHistory } from 'react-router-dom';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { GoAButton } from '@abgov/react-components';

const LoginLanding = () => {
  const [tenantId, setTenantId] = useState<string>();
  const history = useHistory();

  return (
    <div>
      <Header isLoginLink={false} />
      <Container>
        <Row>
          <Col></Col>
          <Col>
            <Form>
              <Form.Group controlId="tenantId">
                <Form.Label>Please enter tenant ID:</Form.Label>
                <Form.Control
                  onChange={(event): void => {
                    setTenantId(event.target.value);
                  }}
                />
              </Form.Group>

              <GoAButton
                variant="primary"
                onClick={() => {
                  console.log(tenantId);
                  history.push(`/${tenantId}/login`);
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
