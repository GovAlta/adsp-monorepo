import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppDispatch,
  configInitializedSelector,
  directorySelector,
  environmentSelector,
  initializeConfig,
  loginUserWithIDP,
} from '../../state';

import { getRealm } from '../../lib/keycloak';

export const Login = () => {
  const realm = useParams<{ realm: string }>().realm;
  const definitionId = useParams<{ definitionId: string }>().definitionId;

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const environment = useSelector(environmentSelector);
  const directory = useSelector(directorySelector);
  const configInitialized = useSelector(configInitializedSelector);

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = (id: string) => {
    return uuidRegex.test(id);
  };

  const loginByIDP = (realm: string, loginRedirect: string) => {
    const location: string = window.location.href;
    const skipSSO = location.indexOf('kc_idp_hint') > -1;

    const urlParams = new URLSearchParams(window.location.search);
    const idpFromUrl = urlParams.has('kc_idp_hint') ? encodeURIComponent(urlParams.get('kc_idp_hint')) : null;

    let idp = 'core';
    if (skipSSO && !idpFromUrl) {
      idp = ' ';
    }
    dispatch(loginUserWithIDP({ idpFromUrl: idp, realm, from: loginRedirect }));
  };

  const tenantLogin = async (realm: string, definitionId?: string) => {
    let loginRedirectUrl = window.location.origin;
    if (definitionId) {
      loginRedirectUrl = `${window.location.origin}/${realm}/${definitionId}?autoCreate=true`;
    } else {
      loginRedirectUrl = `${window.location.origin}/${realm}`;
    }

    const tenantApi = directory['urn:ads:platform:tenant-service'];
    const updatedRealm = isUUID(realm) ? realm : await getRealm(realm, tenantApi);

    if (updatedRealm) {
      loginByIDP(updatedRealm, loginRedirectUrl);
    } else {
      navigate(`/${realm}`);
    }
  };

  useEffect(() => {
    if (!configInitialized) {
      dispatch(initializeConfig());
    }

    if (realm && Object.keys(environment).length > 0) {
      tenantLogin(realm, definitionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, configInitialized]);

  return null;
};
