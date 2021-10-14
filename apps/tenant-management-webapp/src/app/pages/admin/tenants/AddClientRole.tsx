import React, { useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import GoALinkButton from '@components/LinkButton';
import { GoAForm, GoAFormItem, GoAFormActions } from '@abgov/react-components/experimental';
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
        <GoAForm>
          <GoAFormItem>
            <label htmlFor="first-name">Tenant Name</label>
            <input id="first-name" value={name} onChange={onChangeName} />
            <div>Names cannot container special characters (ex. ! % &)</div>
          </GoAFormItem>
          <GoAFormItem>
            <label htmlFor="email">Email</label>
            <input id="email" value={email} onChange={onChangeEmail} />
          </GoAFormItem>
          <GoAFormActions>
            <GoALinkButton to="/admin/tenants" buttonType="secondary">
              Back
            </GoALinkButton>
            <GoAButton>Activate Tenant</GoAButton>
          </GoAFormActions>
        </GoAForm>
        Need to <a href={'/get-started'}>create a tenant?</a>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

export default AddClientRole;
