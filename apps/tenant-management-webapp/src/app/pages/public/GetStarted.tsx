import React, { useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { Redirect, useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { Page, Main } from '@components/Html';
import GoALinkButton from '@components/LinkButton';
import { TenantCreationLoginInit } from '@store/tenant/actions';
import { KeycloakCheckSSO } from '@store/tenant/actions';

const GetStarted = () => {
  const { authenticated } = useSelector((state: RootState) => ({
    authenticated: state.session.authenticated,
  }));
  const dispatch = useDispatch();

  const location: string = window.location.href;
  const skipSSO = location.indexOf('kc_idp_hint') > -1;
  const history = useHistory();

  useEffect(() => {
    dispatch(KeycloakCheckSSO('core'));
  }, []);

  useEffect(() => {
    if (authenticated) {
      let search = '';
      if (skipSSO) {
        search = '?kc_idp_hint=';
      }

      history.push({
        pathname: '/tenant/creation',
        search: search,
      });
    }
  }, [authenticated]);

  return (
    <Page>
      <Main>
        <h2>Let's get you signed in</h2>
        <p>
          Currently, the Alberta Digital Service Platform only uses the Government of Alberta's account as
          authentication, with plans to expand to other federated login providers in the future.
        </p>

        {!authenticated && (
          <>
            <GoAButton
              buttonType="primary"
              onClick={() => {
                dispatch(TenantCreationLoginInit());
              }}
            >
              Continue with Government Alberta account
            </GoAButton>
            <GoALinkButton buttonType="secondary" to="/">
              Back to main page
            </GoALinkButton>
          </>
        )}
      </Main>
    </Page>
  );
};

export default GetStarted;
