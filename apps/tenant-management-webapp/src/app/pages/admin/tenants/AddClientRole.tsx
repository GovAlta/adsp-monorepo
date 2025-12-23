import React, { useState } from 'react';
import { GoabButton, GoabFormItem, GoabButtonGroup } from '@abgov/react-components';
import GoALinkButton from '@components/LinkButton';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';

const AddClientRole = (): JSX.Element => {
  const [name, setName] = useState('');
  const [email, setMail] = useState('');

  const onChangeName = (event) => {
    setName(event.target.value);
  };
  const onChangeEmail = (event) => {
    setMail(event.target.value);
  };

  return (
    <Page>
      <Main>
        <h2>Activate tenant</h2>
        <p>
          If your tenant creation has been successful, you will have received a confirmation email. Please refer to your
          email for the tenant's name.
        </p>
        <GoabFormItem label="Tenant Name">
          <input id="first-name" value={name} onChange={onChangeName} aria-label="firstName" />
          <div>Names cannot container special characters (ex. ! % &)</div>
        </GoabFormItem>
        <GoabFormItem label="Email">
          <input id="email" value={email} onChange={onChangeEmail} aria-label="e-mail" />
        </GoabFormItem>
        <GoabButtonGroup alignment="end">
          <GoALinkButton to="/admin/tenants" buttonType="secondary">
            Back
          </GoALinkButton>
          <GoabButton>Activate Tenant</GoabButton>
        </GoabButtonGroup>
        Need to <a href={'/get-started'}>create a tenant?</a>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

export default AddClientRole;
