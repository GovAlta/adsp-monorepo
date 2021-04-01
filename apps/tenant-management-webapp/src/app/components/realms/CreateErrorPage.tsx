import React from 'react';
import { Container } from 'react-bootstrap';
import { GoAButton } from '@abgov/react-components';
import Tools from '@assets/tools.png';
import { useHistory } from 'react-router-dom';

import './SignIn.css';

const CreateErrorPage = () => {
  const history = useHistory();

  const onCreateRealm = async () => {
    history.push('/realms/creatingRealm');
  };

  return (
    <Container className="signin-body mt-5">
      <div style={{ textAlign: 'center' }}>
        <div className="mb-5">
          <img src={Tools} alt="Tools" style={{ width: '125px' }}></img>
        </div>
        <div className="signin-title mb-5">
          <h1 style={{ fontWeight: 'bold' }}>Unfortunately, there was a problem creating your tenant</h1>
        </div>
        <div className="mb-5" style={{ fontSize: '23px' }}>
          We appologize for the inconvenience, but we could not successfully create your tenant, please try again
        </div>
        <div style={{ margin: '35px 0 0 11px' }}>
          <GoAButton onClick={onCreateRealm}>Create Tenant</GoAButton>
        </div>
      </div>
    </Container>
  );
};

export default CreateErrorPage;
