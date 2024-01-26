import React, { useEffect } from 'react';

import { Page } from '@components/Html';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { TenantLogin, UpdateLoginSuccess } from '@store/tenant/actions';
import { RootState } from '@store/index';

const LoginLanding = (): JSX.Element => {
  const realm = useParams<{ realm: string }>().realm;
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);
  const tenant = useSelector((state: RootState) => state.tenant);
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    if (realm) {
      dispatch(TenantLogin(realm));
    }
  }, [keycloakConfig]);

  if (tenant?.loginSucceeded === false) {
    history.push('/');
    dispatch(UpdateLoginSuccess(null));
  }

  return <Page></Page>;
};

export default LoginLanding;
