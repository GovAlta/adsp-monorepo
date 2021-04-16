import React, { useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import axios from 'axios';
import { Aside, Main, Page } from '@components/_/Html';
import SupportLinks from '@components/_/SupportLinks';

const CreateErrorPage = () => {
  const [name, setName] = useState('');
  const [email, setMail] = useState('');

  const onAddClientRole = async () => {
    const url = `/addClientRoleMapping?realm=${name} &email= ${email}`;
    const res = await axios.get(url);
  };

  return (
    <Page>
      <Main>
        <p>We apologize for the inconvenience, but we could not successfully activate your tenant. Please try again.</p>
        <GoAButton onClick={onAddClientRole}>Activate Tenant</GoAButton>
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

export default CreateErrorPage;
