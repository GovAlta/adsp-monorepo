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

const LoginLanding = () => {
  const { signIn } = useContext(AuthContext);
  const dispatch = useDispatch();
  const nameRef = useRef(null);
  const search = useLocation().search;
  const isDirectLogin = new URLSearchParams(search).get('direct');
  const tenantName = useParams<{ tenantName: string }>().tenantName;
  const error = new URLSearchParams(search).get('error');

  const isAuthenticated = useSelector((state: RootState) => state.session?.authenticated ?? false);

  useEffect(() => {
    console.log(JSON.stringify(isAuthenticated) + '<isAuthenticated');
    if (!isAuthenticated) {
      setTimeout(function () {
        signIn('/login-redirect');
        //signIn('/admin/tenant-admin');
      }, 1);
    }
    // if (!tenantName) {
    //   tenantName = new URLSearchParams(search).get('tenantName');
    // }

    // const { tenantRealm } = useSelector((state: RootState) => ({
    //   tenantRealm: state.tenant.realm,
    // }));

    // useEffect(() => {
    //   console.log(JSON.stringify('trigger loginxx'));
    //   console.log(JSON.stringify(tenantRealm) + '<tenantRealm');
    //   console.log(JSON.stringify(loginTrigger) + '<loginTrigger');
    //   if (tenantRealm && loginTrigger) {
    //     console.log('/admin/tenant-admin');
    //     delayedLogin();
    //     signIn(`/login/redirect?error=NoTenant`);
    //     //?tenantName=${tenantRealm}`
    //   }

    //   console.log(JSON.stringify('trigger loginxxu'));
    //   function delayedLogin() {
    //     setTimeout(function () {
    //       signIn('/admin/tenant-admin');
    //     }, 1);
    //   }

    //   // if (tenantName) {
    //   //   console.log(JSON.stringify('shold not get here'));
    //   //   dispatch(SelectTenant(tenantName));
    //   //   // For direct login, we shall hide the tenant login form and invoke the keycloak
    //   //   if (isDirectLogin === 'true') {
    //   //     delayedLogin();
    //   //   }
    //   // }
    // }, [dispatch, tenantName, isDirectLogin, signIn]);

    // console.log(JSON.stringify(tenantName) + '<tenantName');

    // useEffect(() => {
    //   console.log(JSON.stringify('trigger login'));
    if (tenantName) {
      console.log(JSON.stringify(tenantName) + '<tenantNamexx');
      //const name = nameRef.current.value;
      dispatch(SelectTenant(tenantName));
      // For direct login, we shall hide the tenant login form and invoke the keycloak
      //if (isDirectLogin === 'true') {
      //dispatch(SelectTenant(tenantName));
      signIn('/login-redirect');
      //}
    }
  }, [tenantName, isDirectLogin]);

  function login() {
    const name = nameRef.current.value;
    dispatch(SelectTenant(name));
    signIn('/login-redirect');
  }
  //     setLoginTrigger(true);
  //   }
  // }, [tenantName]);

  return (
    <Page>
      {!isDirectLogin && (
        <Main>
          <h2>You are in a bad place</h2>
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
              <p>If you meant to create a tenant, please click here</p>
              <GoAButton buttonType="primary" onClick={() => signIn('/get-started')}>
                Create Tenant
              </GoAButton>

              <p>
                If you want to log into a tenant created by an administrator, please ask the administrator for the login
                url
              </p>
            </div>
          )}

          {/* <GoAForm>
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
          </GoAForm> */}
        </Main>
      )}
    </Page>
  );
};

export default LoginLanding;
