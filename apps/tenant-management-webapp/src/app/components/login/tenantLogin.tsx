import React, { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { SelectTenant } from '@store/tenant/actions';
import Header from '@components/appHeader';
import AuthContext from '@lib/authContext';
import { GoAButton } from '@abgov/react-components';
import { Row, Col } from 'react-bootstrap';

function TenantLogin() {
  const dispatch = useDispatch();
  const { signIn } = useContext(AuthContext);
  const { tenantName } = useParams<{ tenantName: string }>();

  useEffect(() => {
    dispatch(SelectTenant(tenantName));
  }, [dispatch, tenantName]);

  function login() {
    signIn('/tenant-admin');
  }

  return (
    <div>
      <div>
        <Header isLoginLink={false} />
      </div>
      <Row>
        <Col md={1}></Col>
        <Col md={11}>
          <GoAButton buttonType="primary" buttonSize="normal" onClick={login}>
            Tenant {tenantName} Login
          </GoAButton>
        </Col>
      </Row>
    </div>
  );
}
export default TenantLogin;
