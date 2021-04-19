import React, { useContext, useEffect, useRef, useState } from 'react';

import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/Form';
import { Page, Main } from '@components/Html';
import AuthContext from '@lib/authContext';
import { SelectTenant } from '@store/tenant/actions';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { useParams } from 'react-router-dom';

const LoginLanding = () => {
  const { signIn } = useContext(AuthContext);
  const dispatch = useDispatch();
  const { tenantName } = useParams<{ tenantName: string }>();
  const nameRef = useRef(null);

  useEffect(() => {
    if (tenantName) {
      dispatch(SelectTenant(tenantName));
    }
  }, [dispatch, tenantName]);

  function login() {
    const name = nameRef.current.value;
    dispatch(SelectTenant(name));
    signIn('/admin/tenant-admin');
  }

  return (
    <Page>
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
    </Page>
  );
};

export default LoginLanding;
