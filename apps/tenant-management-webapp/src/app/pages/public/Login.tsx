import React, { useContext, useEffect, useRef, useState } from 'react';

import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/Form';
import { Page, Main } from '@components/Html';
import AuthContext from '@lib/authContext';
import { SelectTenant } from '@store/tenant/actions';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const LoginLanding = () => {
  const { signIn } = useContext(AuthContext);
  const dispatch = useDispatch();
  const nameRef = useRef(null);
  const search = useLocation().search;
  const isDirectLogin = new URLSearchParams(search).get('direct');
  const tenantName = useParams<{ tenantName: string }>().tenantName;

  useEffect(() => {
    if (tenantName) {
      dispatch(SelectTenant(tenantName));
      // For direct login, we shall hide the tenant login form and invoke the keycloak
      if (isDirectLogin === 'true') {
        dispatch(SelectTenant(tenantName));
        signIn('/login-redirect');
      }
    }
  }, [tenantName, isDirectLogin]);

  function login() {
    const name = nameRef.current.value;
    dispatch(SelectTenant(name));
    signIn('/login-redirect');
  }

  return (
    <Page>
      {!isDirectLogin && (
        <Main>
          <GoAForm>
            <GoAFormItem>
              {tenantName && (
                <>
                  <label>Please enter tenant name:</label>
                  <input ref={nameRef} value={tenantName} readOnly />
                </>
              )}
              {!tenantName && (
                <>
                  <label>Please enter tenant name:</label>
                  <input ref={nameRef} />
                </>
              )}
            </GoAFormItem>

            <GoAFormButtons>
              <GoAButton buttonType="primary" onClick={login}>
                Login
              </GoAButton>
            </GoAFormButtons>
          </GoAForm>
        </Main>
      )}
    </Page>
  );
};

export default LoginLanding;
