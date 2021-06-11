import React, { useEffect, useRef } from 'react';

import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/Form';
import { Page } from '@components/Html';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { TenantLogin } from '@store/tenant/actions';
import { RootState } from '@store/index';

const LoginLanding = () => {
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
