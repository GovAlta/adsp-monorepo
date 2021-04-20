import React, { useContext, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoAButton, GoANotification } from '@abgov/react-components';

import { CreateTenant, SelectTenant, IsTenantAdmin } from '@store/tenant/actions';
import { RootState } from '@store/index';
import AuthContext from '@lib/authContext';
import GoALinkButton from '@components/LinkButton';
import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/Form';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';

const CreateRealm = () => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const authContext = useContext(AuthContext);

  const onCreateRealm = async () => {
    dispatch(CreateTenant(name));
  };

  const onChangeName = (event) => {
    setName(event.target.value);
  };

  const { isTenantAdmin, userInfo, isTenantCreated } = useSelector((state: RootState) => ({
    isTenantAdmin: state.tenant.isTenantAdmin,
    userInfo: state.session.userInfo,
    isTenantCreated: state.tenant.isTenantCreated,
  }));

  useEffect(() => {
    if (userInfo) {
      dispatch(IsTenantAdmin(userInfo.email));
    }
  }, [dispatch, userInfo]);

  const ErrorMessage = (props) => {
    const message = `${props.email} has already created a tenant. Currently only one tenant is allowed per person.`;
    return <GoANotification type="information" title="Notification Title" message={message} />;
  };

  function login() {
    dispatch(SelectTenant(name));
    authContext.signIn('/admin/tenant-admin');
  }

  return (
    <Page>
      <Main>
        {userInfo && isTenantAdmin && <ErrorMessage email={userInfo.email} />}
        {isTenantCreated ? (
          <>
            <p>The '{name}' has been successfully created</p>
            <GoAButton onClick={login}>Tenant Login</GoAButton>
          </>
        ) : (
          <>
            {!isTenantAdmin ? (
              <>
                <h2>Create tenant</h2>
                <p>As a reminder, you are only able to create one tenant per user account.</p>
                <GoAForm>
                  <GoAFormItem>
                    <label htmlFor="name">Tenant Name</label>
                    <input id="name" type="text" value={name} onChange={onChangeName} />
                    <em>Names cannot container special characters (ex. ! % &amp;)</em>
                  </GoAFormItem>
                  <GoAFormButtons>
                    <GoALinkButton to="/admin/tenants" buttonType="secondary">
                      Back
                    </GoALinkButton>
                    <GoAButton onClick={onCreateRealm}>Create Tenant</GoAButton>
                  </GoAFormButtons>
                </GoAForm>
              </>
            ) : null}
          </>
        )}
      </Main>
      <Aside>
        <SupportLinks />
      </Aside>
    </Page>
  );
};

export default CreateRealm;
