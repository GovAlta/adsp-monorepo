import React, { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { SelectTenant } from '@store/tenant/actions';
import Header from '@components/appHeader';
import AuthContext from '@lib/authContext';
import { GoAButton } from '@abgov/react-components';

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
    <>
      <Header hasLoginLink={false} />
      <GoAButton buttonType="primary" onClick={login}>
        Tenant {tenantName} Login
      </GoAButton>
    </>
  );
}
export default TenantLogin;
