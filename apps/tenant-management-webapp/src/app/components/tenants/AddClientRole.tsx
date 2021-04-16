import React, { useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import axios from 'axios';
import GoALinkButton from '@components/_/LinkButton';
import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/_/Form';
import { Aside, Main, Page } from '@components/_/Html';
import SupportLinks from '@components/_/SupportLinks';

const AddClientRole = () => {
  const [name, setName] = useState('');
  const [email, setMail] = useState('');

  const onAddClientRole = async () => {
    const url = `/addClientRoleMapping?realm=${name}&email='${email}`;
    const res = await axios.get(url);
  };

  const onChangeName = (event) => {
    setName(event.target.value);
  };
  const onChangeEmail = (event) => {
    setMail(event.target.value);
  };

  return (
    <Page>
      <Main>
        <h1>Activate tenant</h1>
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
          <GoAFormButtons>
            <GoALinkButton to="/tenants" buttonType="secondary">
              Back
            </GoALinkButton>
            <GoAButton onClick={onAddClientRole}>Activate Tenant</GoAButton>
          </GoAFormButtons>
        </GoAForm>
        Need to <a href={'/tenants/start'}>create a tenant?</a>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

export default AddClientRole;
