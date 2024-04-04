import React, { useEffect } from 'react';

import { Page } from '@components/Html';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { TenantLogin, UpdateLoginSuccess } from '@store/tenant/actions';
import { RootState } from '@store/index';

const LoginLanding = (): JSX.Element => {
  const realm = useParams<{ realm: string }>().realm;
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);
  const tenant = useSelector((state: RootState) => state.tenant);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (realm) {
      dispatch(TenantLogin(realm));
    }
  }, [keycloakConfig, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (tenant?.loginSucceeded === false) {
    dispatch(UpdateLoginSuccess(null));
    navigate('/');
  }

  return <Page></Page>;
};

export default LoginLanding;
