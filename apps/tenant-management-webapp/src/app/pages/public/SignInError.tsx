import React from 'react';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import GoALinkButton from '@components/LinkButton';
import { useDispatch } from 'react-redux';
import { TenantLogout } from '@store/tenant/actions';

export const SignInError = () => {
  const dispatch = useDispatch();
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
          <li>Click the button below to the main page</li>
          <li>
            Click the <b>Get Started</b> Button to create a new tenant.
          </li>
        </ul>

        <GoALinkButton
          buttonType="primary"
          to=""
          onClick={() => {
            dispatch(TenantLogout());
          }}
        >
          Back to Main Page
        </GoALinkButton>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
