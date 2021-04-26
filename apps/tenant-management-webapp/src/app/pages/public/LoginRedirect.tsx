import React, { useEffect, useState } from 'react';
import { Page } from '@components/Html';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { IsTenantAdmin } from '@store/tenant/actions';
import { useHistory } from 'react-router-dom';

const LoginTypes = {
  coreNonTenantAdmin: 'core-non-tenant-admin',
  coreTenantAdmin: 'core-tenant-admin',
  tenant: 'tenant',
};

interface CoreAdminRedirectProps {
  tenantName: string;
}
const CoreAdminRedirect = (props: CoreAdminRedirectProps) => {
  const history = useHistory();
  useEffect(() => {
    history.push(`/${props.tenantName}/login?direct=true`);
  });
  return (
    <div>
      <h2> Redirect to tenant login</h2>
    </div>
  );
};

const CoreNonAdminRedirect = () => {
  const history = useHistory();
  useEffect(() => {
    history.push(`/login`);
  });
  return <div></div>;
};

const LoginRedirect = () => {
  const dispatch = useDispatch();
  const defaultRealm = 'core';
  const history = useHistory();

  const [loginType, setLoginType] = useState('');

  const { realm, userInfo, isTenantAdmin, tenantName } = useSelector((state: RootState) => ({
    realm: state.session.realm,
    userInfo: state.session.userInfo,
    isTenantAdmin: state.tenant.isTenantAdmin,
    tenantName: state.tenant.name,
  }));

  useEffect(() => {
    if (realm && realm !== defaultRealm && tenantName) {
      /**
       * If user has tenantName. The user might be a login user. Redirect to admin portal. The auth layer in the admin portal will handle the rest.
       */
      history.push('/admin/tenant-admin');
    }

    if (realm && realm === defaultRealm) {
      if (userInfo && isTenantAdmin === null) {
        // isTenantAdmin and tenantName need to be updated
        dispatch(IsTenantAdmin(userInfo.email));
      }
      // Do not remove the !== here. isTenantAdmin has 3 states null, false, true
      if (userInfo && isTenantAdmin !== null) {
        if (isTenantAdmin) {
          setLoginType(LoginTypes.coreTenantAdmin);
        } else {
          setLoginType(LoginTypes.coreNonTenantAdmin);
        }
      }
    }
  }, [dispatch, userInfo, isTenantAdmin, tenantName]);

  return (
    <Page>
      {loginType === LoginTypes.coreTenantAdmin && <CoreAdminRedirect tenantName={tenantName} />}
      {loginType === LoginTypes.coreNonTenantAdmin && <CoreNonAdminRedirect />}
    </Page>
  );
};

export default LoginRedirect;
