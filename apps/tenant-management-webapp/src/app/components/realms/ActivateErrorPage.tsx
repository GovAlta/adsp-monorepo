import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { GoAButton } from '@abgov/react-components';
import Tools from '../../../assets/tools.png';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import './SignIn.css';

const CreateErrorPage = () => {
  const [name, setName] = useState('');
  const [email, setMail] = useState('');

  const history = useHistory();

  const onAddClientRole = async () => {
    const url = `/addClientRoleMapping?realm=${name} &email= ${email}`;
    const res = await axios.get(url);
    alert(res.data.Msg);
  };

  return (
    <Container className="signin-body mt-5">
      <div style={{ textAlign: 'center' }}>
        <div className="mb-5">
          <img src={Tools} alt="Tools" style={{ width: '125px' }}></img>
        </div>
        <div className="signin-title mb-5">
          <h1 style={{ fontWeight: 'bold' }}>
            Unfortunately, there was an activation error.
          </h1>
        </div>

        <div className="mb-5" style={{ fontSize: '23px' }}>
          We appologize for the inconvenience, but we could not successfully
          activate your tenant. Please try again.
        </div>
        <div style={{ margin: '35px 0 0 11px' }}>
          <GoAButton onClick={onAddClientRole}>Activate Tenant</GoAButton>
        </div>
      </div>
    </Container>
  );
};

export default CreateErrorPage;
