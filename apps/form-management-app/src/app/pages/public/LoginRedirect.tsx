/* eslint-disable */
import React, { useEffect } from 'react';


import { AppState } from 'app/state';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LOGIN_TYPES, getOrCreateKeycloakAuth } from '@lib/keycloak';

interface LoginProps {
  location?: string;
}

const LoginRedirect = (props: LoginProps): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  console.log("CALLBACK PAGE")

  const config = useSelector((state: AppState) => ({
    keycloak: state.config,
  }));

  console.log(JSON.stringify(config) + "<config  --------")
  //console.log(JSON.stringify(session) + '<session  --------');

  // const { keycloak } = useSelector((state: AppState) => ({

  //   keycloak: state.config?.keycloakApi,
  // }));

  // // eslint-disable-next-line react-hooks/exhaustive-deps
  const urlParams = new URLSearchParams(window.location.search);
  const realm = 'b6aff762-20f8-4c5d-88d3-c38ae16d1937';  //decodeURIComponent(urlParams.get('realm')) || 'core';
  const type = decodeURIComponent(urlParams.get('type')) || LOGIN_TYPES.tenant;
  const idp = decodeURIComponent(urlParams.get('kc_idp_hint'));

    console.log(JSON.stringify(urlParams) + '<urlParams  --------');
    console.log(JSON.stringify(realm) + '<realm  --------');
    console.log(JSON.stringify(type) + '<type  --------');
    console.log(JSON.stringify(idp) + '<idp  --------');


  useEffect(() => {
    (async () => {
      console.log(JSON.stringify("callaback"))

      const keycloakData = config.keycloak.environment.access;
        console.log(JSON.stringify(keycloakData?.url) + '<keycloak?.url');
        console.log(JSON.stringify(keycloakData?.client_id) + '<keycloak?.clientId');
      if (!keycloakData) return;
      const auth = await getOrCreateKeycloakAuth(
        { url: keycloakData.url, clientId: keycloakData.client_id } as any,
        realm
      );

         console.log(JSON.stringify(auth) + '<auth');
      const session = await auth.checkSSO();
           console.log(JSON.stringify(session) + '<sessionsessionsessionxxxxxxxxxxxx');
      if (session?.authenticated) {
         console.log(JSON.stringify(session) + '<sessionsessionsessionsession');
        //dispatch(setSession(session));
        // Route decisions based on previous logic
        if (type === LOGIN_TYPES.tenant) {
          const skipSSO = urlParams.get('skipSSO') === 'true';
          const searchQuery = skipSSO ? '?kc_idp_hint=' : '';
          navigate(`/admin${searchQuery}`);
        } else if (type === LOGIN_TYPES.tenantAdmin) {
          navigate(`/admin?realm=${realm}`);
        } else {
          navigate(`/admin`);
        }
      } else {
        navigate('/login');
      }
    })();
  }, [navigate, dispatch, urlParams, realm, type]);

  return <div></div>;
};

export default LoginRedirect;
