import React, { useContext, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoAButton, GoANotification, GoAElementLoader } from '@abgov/react-components';

import { CreateTenant, IsTenantAdmin, SelectTenant, UpdateTenantCreated } from '@store/tenant/actions';
import { RootState } from '@store/index';
import AuthContext from '@lib/authContext';
import GoALinkButton from '@components/LinkButton';
import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/Form';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { SessionLogout } from '@store/session/actions';

const CreateRealm = () => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [isLoaded, setIsLoaded] = useState(true);
  const [isTenantCreatedState, setIsTenantCreatedState] = useState(false);
  const authContext = useContext(AuthContext);

  const onCreateRealm = async () => {
    handleIsLoadedToggle();
    dispatch(CreateTenant(name));
  };

  const onChangeName = (event) => {
    setName(event.target.value);
  };

  const handleIsLoadedToggle = () => {
    setIsLoaded((currentIsLoaded) => !currentIsLoaded);
  };

  const { isTenantAdmin, userInfo, isTenantCreated, tenantRealm } = useSelector((state: RootState) => ({
    isTenantAdmin: state.tenant.isTenantAdmin,
    userInfo: state.session.userInfo,
    isTenantCreated: state.tenant.isTenantCreated,
    tenantRealm: state.tenant.realm,
  }));

  useEffect(() => {
    if (userInfo) {
      dispatch(IsTenantAdmin(userInfo.email));
    }
  }, [dispatch, userInfo]);

  const ErrorMessage = (props) => {
    const message = `${props.email} has already created a tenant. Currently only one tenant is allowed per person.`;
    return <GoANotification type="information" title="Notification Title" message={message} isDismissable={false} />;
  };

  useEffect(() => {
    if (isTenantCreated) {
      setIsTenantCreatedState(true);
      dispatch(UpdateTenantCreated());
    }
  }, [isTenantCreated, dispatch]);

  function login() {
    dispatch(SessionLogout());
    dispatch(SelectTenant(tenantRealm));
    authContext.signIn(`/login-redirect`);
    handleIsLoadedToggle();
  }

  return (
    <Page>
      <Main>
        {userInfo && isTenantAdmin && (
          <div>
            <ErrorMessage email={userInfo.email} />
            <p>Log into your existing tenant:</p>
            <GoAButton onClick={login}>Tenant Login</GoAButton>
          </div>
        )}
        {isTenantCreatedState ? (
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
                  {isLoaded ? (
                    <GoAFormButtons>
                      <GoALinkButton to="/admin/tenants" buttonType="secondary">
                        Back
                      </GoALinkButton>
                      <GoAButton onClick={onCreateRealm}>Create Tenant</GoAButton>
                    </GoAFormButtons>
                  ) : (
                    <GoAButton buttonType="primary" buttonSize="normal">
                      Creating Tenant...
                      <GoAElementLoader visible={true} size={25} baseColour="#c8eef9" spinnerColour="#0070c4" />
                    </GoAButton>
                  )}
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
