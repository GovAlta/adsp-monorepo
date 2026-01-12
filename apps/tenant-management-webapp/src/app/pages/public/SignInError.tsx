import React, { useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import GoALinkButton from '@components/LinkButton';
import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';

export const SignInError = (): JSX.Element => {
  const [showModal, setShowModel] = useState(false);
  return (
    <Page>
      <Main>
        <h3>You are not the tenant admin (root) user in our record</h3>
        <h4>Trying to join an existing tenant?</h4>
        <div>If you ended up here by mistake and need access to an existing ADSP project:</div>
        <ul>
          <li>
            <b>Do not click "Create Tenant"</b>
          </li>
        </ul>

        <GoabButton
          type="secondary"
          onClick={() => {
            setShowModel(true);
          }}
        >
          I want to join an existing tenant
        </GoabButton>
        <p>
          <i>Click here to learn how to request access from your tenant admin.</i>
        </p>

        <h4>Want to create a new tenant?</h4>
        <ul>
          Click below only if you are a developer or team lead starting a new project using ADSP and need to set up a
          new environment.
        </ul>

        <GoALinkButton buttonType="primary" to="/tenant/creation">
          Create Tenant
        </GoALinkButton>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
      <GoabModal
        testId="target-cache"
        open={showModal}
        heading={'Joining an existing tenant'}
        maxWidth="640px"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              testId="add-edit-cache-cancel"
              type="primary"
              onClick={() => {
                setShowModel(false);
              }}
            >
              Close
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <ul>
          <li>Contact your administrator or project lead for a login URL to their tenant.</li>
          <li>Tenant admins can copy the login URL from the tenant admin view.</li>
        </ul>
      </GoabModal>
    </Page>
  );
};
