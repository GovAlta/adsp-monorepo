import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/Form';
import { Page, Main } from '@components/Html';
import AuthContext from '@lib/authContext';
import { SelectTenant } from '@store/tenant/actions';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import GoALinkButton from '@components/LinkButton';
import { RootState } from '@store/index';
import { keycloak } from '@lib/session';

const AutoLoginLanding = () => {
  const { signIn } = useContext(AuthContext);
  const dispatch = useDispatch();
  const search = useLocation().search;
  const isDirectLogin = new URLSearchParams(search).get('direct');
  const tenantName = useParams<{ tenantName: string }>().tenantName;
  const error = new URLSearchParams(search).get('error');

  useEffect(() => {
    if (isDirectLogin) {
      dispatch(SelectTenant(tenantName));
      setTimeout(function () {
        signIn('/login-redirect');
      }, 1600);
    } else {
      setTimeout(function () {
        signIn(`/${tenantName}/autologin?direct=true`);
      }, 20);
    }
  }, [tenantName, isDirectLogin]);

  return (
    <Page>
      {!isDirectLogin ? (
        <Main>
          <h2>You will be redirected shortly...</h2>
          {error === 'NoTenant' ? (
            <div>
              <div style={{ backgroundColor: 'red', padding: '10px', color: '#FFFFFF' }}>
                The tenant you have entered does not exist
              </div>
              <GoALinkButton buttonType="secondary" to="/">
                Back to main page
              </GoALinkButton>
            </div>
          ) : (
            <div>
              <p>If you meant to create a tenant, please click below</p>
              <GoAButton buttonType="primary" onClick={() => signIn('/get-started')}>
                Create Tenant
              </GoAButton>

              <p>
                If you want to log into a tenant created by an administrator, please ask the administrator for the login
                url
              </p>
            </div>
          )}
        </Main>
      ) : (
        <Main>
          <h2>Logging in</h2>
          <p>If it's not working, click below</p>
          <GoAButton buttonType="primary" onClick={() => signIn('/login-redirect')}>
            Login
          </GoAButton>
        </Main>
      )}
    </Page>
  );
};

export default AutoLoginLanding;
