import React, { useEffect } from 'react';

import { Page } from '@components/Html';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { TenantLogin } from '@store/tenant/actions';
import { RootState } from '@store/index';

const LoginLanding = (): JSX.Element => {
  const realm = useParams<{ realm: string }>().realm;
  const keycloakConfig = useSelector((state: RootState) => state.config.keycloakApi);

  const dispatch = useDispatch();

  useEffect(() => {
    if (realm) {
      dispatch(TenantLogin(realm));
    }
  }, [keycloakConfig]);

  return <Page></Page>;
};

export default LoginLanding;
