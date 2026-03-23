import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppDispatch,
  configInitializedSelector,
  directorySelector,
  environmentSelector,
  initializeConfig,
  loginUserWithIDP,
} from '../state';
import { getRealm } from '../lib/keycloak';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID = (id: string) => uuidRegex.test(id);

export const Login = () => {
  const realm = useParams<{ realm: string }>().realm;

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const environment = useSelector(environmentSelector);
  const directory = useSelector(directorySelector);
  const configInitialized = useSelector(configInitializedSelector);

  const loginByIDP = useCallback(
    (currentRealm: string, loginRedirect: string) => {
      const location = window.location.href;
      const skipSSO = location.includes('kc_idp_hint');

      const urlParams = new URLSearchParams(window.location.search);
      const idpFromUrl = urlParams.has('kc_idp_hint') ? encodeURIComponent(urlParams.get('kc_idp_hint')) : null;

      let idp = 'core';
      if (skipSSO && !idpFromUrl) {
        idp = ' ';
      }

      dispatch(loginUserWithIDP({ idpFromUrl: idp, realm: currentRealm, from: loginRedirect }));
    },
    [dispatch],
  );

  const tenantLogin = useCallback(
    async (realmName: string) => {
      const loginRedirectUrl = `${window.location.origin}/${realmName}`;
      const tenantApi = directory['urn:ads:platform:tenant-service'];
      const resolvedRealm = isUUID(realmName) ? realmName : await getRealm(realmName, tenantApi);

      if (resolvedRealm) {
        loginByIDP(resolvedRealm, loginRedirectUrl);
      } else {
        navigate(`/${realmName}`);
      }
    },
    [directory, loginByIDP, navigate],
  );

  useEffect(() => {
    if (!configInitialized) {
      dispatch(initializeConfig());
    }

    if (realm && Object.keys(environment).length > 0) {
      tenantLogin(realm);
    }
  }, [dispatch, configInitialized, realm, environment, tenantLogin]);

  return null;
};
