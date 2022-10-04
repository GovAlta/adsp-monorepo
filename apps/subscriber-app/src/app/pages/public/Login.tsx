import React, { useEffect } from 'react';

import { Page } from '@components/Html';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-6';
import { TenantLogin } from '@store/tenant/actions';
import { RootState } from '@store/index';

const LoginLanding = (): JSX.Element => {
  let { realm } = useParams();

  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);
  const dispatch = useDispatch();
  useEffect(() => {
    if (realm && keycloakConfig) {
      dispatch(TenantLogin(realm));
    }
  }, [keycloakConfig]);

  return <Page></Page>;
};

export default LoginLanding;
