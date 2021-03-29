import React, { useContext, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col } from 'reactstrap';
import { GoAButton, GoANotification } from '@abgov/react-components';
import { useHistory } from 'react-router-dom';
import { CreateTenant, SelectTenant, IsTenantAdmin } from '../../store/tenant/actions';
import { RootState } from '../../store';
import { Link } from 'react-router-dom';
import './SignIn.css';
import AuthContext from '../../authContext';

const CreateRealm = () => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');

  const history = useHistory();

  const authContext = useContext(AuthContext);

  const onCreateRealm = async () => {
    dispatch(CreateTenant(name));
  };

  const backToMain = () => {
    history.push('/realms');
  };

  const onChangeName = (event) => {
    setName(event.target.value);
  };

  const { isTenantAdmin, email } = useSelector((state: RootState) => ({
    isTenantAdmin: state.tenant.isTenantAdmin,
    email: state.session.userInfo?.email,
  }));

  useEffect(() => {
    dispatch(IsTenantAdmin(email));
  }, [email]);

  const NewTenatLoginLink = () => {
    const tenantLoginUrl = `/${name}/login`;
    const { isTenantCreated } = useSelector((state: RootState) => ({
      isTenantCreated: state.tenant.isTenantCreated,
    }));

    return (
      <div className={isTenantCreated ? '' : 'd-none'}>
        <div>
          <p>New Tenant: {name} has successfully created. </p> <br />
        </div>
        <div>
          <div
            onClick={() => {
              dispatch(SelectTenant(name));
              authContext.signIn('/tenant-admin');
            }}
          >
            Tenant Login
          </div>
          <Link to={tenantLoginUrl}> Clik to tennat login </Link>
        </div>
      </div>
    );
  };

  const ErrorMessage = (props) => {
    const message = `${props.email} has created one tenant before. Now, one can create only one tenant.`;
    return <GoANotification type="information" title="Notification Title" message={message}></GoANotification>;
  };

  return (
    <Container className="signin-body mt-5">
      <Row>
        <Col className={isTenantAdmin ? '' : 'd-none'}>
          <ErrorMessage email={email} />
        </Col>
        <Col lg={{ size: 6 }} md={{ size: 10 }} className={isTenantAdmin ? 'd-none' : 'create-tenant-form-border'}>
          <div className={'create-tenant-form'}>
            <div className="signin-title mb-6">
              <h1 style={{ fontWeight: 'bold', textAlign: 'left' }}>Create tenant</h1>
            </div>
            <div>
              <div className="mb-6">As a reminder, you are only able to create one tenant per user account</div>
              <br />
              <label htmlFor="fname" className="siginin-small-title">
                Tenant Name
              </label>
              <input className="signin-input" value={name} onChange={onChangeName} />
              <div className="siginin-subset">Names cannot container special characters (ex. ! % &)</div>
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ margin: '35px 11px 0 0' }}>
                  <GoAButton onClick={backToMain} buttonType="secondary">
                    Back
                  </GoAButton>
                </div>
                <div style={{ margin: '35px 0 0 11px' }}>
                  <GoAButton onClick={onCreateRealm}>Create Tenant</GoAButton>
                </div>
              </div>
            </div>
            <NewTenatLoginLink />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateRealm;
