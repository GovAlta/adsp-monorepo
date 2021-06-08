import React, { useEffect, useState } from 'react';
import { Page } from '@components/Html';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { IsTenantAdmin } from '@store/tenant/actions';
import { useHistory } from 'react-router-dom';
import { TenantLogout } from '@store/tenant/actions';
import { SessionLogout } from '@store/session/actions';

const LoginTypes = {
  coreNonTenantAdmin: 'core-non-tenant-admin',
  coreTenantAdmin: 'core-tenant-admin',
  tenant: 'tenant',
};

interface CoreAdminRedirectProps {
  tenantRealm: string;
}

// TODO: deprecate the CoreAdminRedirect in CS-524
const CoreAdminRedirect = (props: CoreAdminRedirectProps) => {
  console.log('should not be core right? CoreAdminRedirect');
  const history = useHistory();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(TenantLogout());
    dispatch(SessionLogout());
    dispatch(SessionLogout());
    history.push(`/${props.tenantRealm}/login?direct=true`);
  });
  return (
    <div>
      <h2> Redirect to tenant login</h2>
    </div>
  );
};

const CoreNonAdminRedirect = () => {
  console.log('CoreNonAdminRedirect');
  const history = useHistory();
  useEffect(() => {
    history.push(`/admin/tenant-admin`);
  });
  return <div></div>;
};

const LoginRedirect = () => {
  const dispatch = useDispatch();
  const defaultRealm = 'core';
  const history = useHistory();
  const [loginType, setLoginType] = useState('');

  const { realm, userInfo, isTenantAdmin, tenantRealm } = useSelector((state: RootState) => ({
    realm: state.session.realm,
    userInfo: state.session.userInfo,
    isTenantAdmin: state.tenant.isTenantAdmin,
    tenantRealm: state.tenant.realm,
  }));

  // TODO: isAuthenticated shall be same as the validation in the PrivateApp. Need to create a global function for both.
  const isAuthenticated = useSelector((state: RootState) => state.session?.authenticated ?? false);

  console.log('are we hitting redirect page at all');

  useEffect(() => {
    console.log(JSON.stringify(realm) + '<realm');
    console.log(JSON.stringify(defaultRealm) + '<defaultRealm');
    console.log(JSON.stringify(tenantRealm) + '<tenantRealm');
    if (realm && realm === defaultRealm) {
      if (userInfo && isTenantAdmin === null) {
        // isTenantAdmin and tenantName need to be updated
        console.log('IsTenantAdmin(userInfo.email)');
        dispatch(IsTenantAdmin(userInfo.email));
      }
      // Do not remove the !== here. isTenantAdmin has 3 states null, false, true
      if (userInfo && isTenantAdmin !== null) {
        console.log('userInfo && isTenantAdmin');
        if (isTenantAdmin) {
          setLoginType(LoginTypes.coreTenantAdmin);
        } else {
          setLoginType(LoginTypes.coreNonTenantAdmin);
        }
      }
    } else {
      if (tenantRealm && tenantRealm !== defaultRealm) {
        // Tenant Login redirect
        console.log('if authenticated: ' + isAuthenticated);
        if (isAuthenticated) {
          console.log('we redirect');
          history.push('/admin/tenant-admin');
        }
      }
    }
  }, [dispatch, userInfo, isTenantAdmin, tenantRealm, isAuthenticated]);

  return (
    <Page>
      {loginType === LoginTypes.coreTenantAdmin && <CoreAdminRedirect tenantRealm={tenantRealm} />}
      {loginType === LoginTypes.coreNonTenantAdmin && <CoreNonAdminRedirect />}
    </Page>
  );
};

export default LoginRedirect;
