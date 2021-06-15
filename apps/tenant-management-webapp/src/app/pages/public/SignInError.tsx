import React from 'react';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import GoALinkButton from '@components/LinkButton';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

export const SignInError = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  return (
    <Page>
      <Main>
        <h3>You are not the tenant admin (root) user in our record</h3>
        <h4>If you like to login to pre-existing realm</h4>
        <ul>
          <li>Contact your administrator for an URL to log into their realm.</li>
          <li>Tenant admin can copy the URL from the tenant admin view.</li>
        </ul>

        <h4>If you like to create a new tenant</h4>
        <ul>
          <li>Click the button below</li>
        </ul>
        <GoALinkButton buttonType="primary" to="/tenant/creation">
          Create Tenant
        </GoALinkButton>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
