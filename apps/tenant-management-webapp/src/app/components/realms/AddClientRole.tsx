import React, { useState } from 'react';
import { Container, Row, Col } from 'reactstrap';
import { GoAButton } from '@abgov/react-components';
import axios from 'axios';
import './SignIn.css';
import { useHistory } from 'react-router-dom';

const AddClientRole = () => {

  const [name, setName] = useState('');
  const [email, setMail] = useState('');


  const history = useHistory();
  const onAddClientRole = async () => {
    const url =
      `/addClientRoleMapping?realm=${name}&email='${email}`;
    const res = await axios.get(url);
    alert(res.data.Msg);
  };

  const backToMain = () => {
    history.push('/realms');
  };

  const onChangeName = (event) => {
    setName(event.target.value);
  };
  const onChangeEmail = (event) => {
    setMail(event.target.value);
  };

  return (
    <Container className="signin-body mt-5">
      <Row>
        <Col
          lg={{ size: 6, offset: 3 }}
          md={{ size: 8, offset: 2 }}
          style={{
            padding: '51px',
            borderStyle: 'solid',
            borderColor: 'grey',
            borderWidth: '1px',
            boxShadow: '1px 2px #888888',
            height: '100%',
            margin: '0 8px 0 8px',
          }}
        >
          <div className="signin-title mb-5">
            <h1 style={{ fontWeight: 'bold', textAlign: 'left' }}>
              Activate tenant
                </h1>
          </div>
          <div className="mb-5">
            If your tenant creation has been successful, you will have
            received a confirmation email. Please refer to your email for
            the tenant's name.
              </div>

          <label htmlFor="fname" className="siginin-small-title">
            Tenant Name
              </label>
          <input
            className="signin-input"
            value={name}
            onChange={onChangeName}
          />
          <div className="siginin-subset">
            Names cannot container special characters (ex. ! % &)
              </div>
          <label htmlFor="fname" className="siginin-small-title">
            Email
              </label>
          <input
            className="signin-input"
            value={email}
            onChange={onChangeEmail}
          />
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ margin: '35px 11px 0 0' }}>
              <GoAButton onClick={backToMain} buttonType="secondary">
                Back
                  </GoAButton>
            </div>
            <div style={{ margin: '35px 0 0 11px' }}>
              <GoAButton onClick={onAddClientRole}>
                Activate Tenant
                  </GoAButton>
            </div>
          </div>
          <div className="mt-5">
            Need to create tenant?{' '}
            <a href={'/realms/CreateRealm'}>Create Tenant</a>
          </div>
        </Col>
      </Row>
    </Container>
  );
}


export default AddClientRole;
