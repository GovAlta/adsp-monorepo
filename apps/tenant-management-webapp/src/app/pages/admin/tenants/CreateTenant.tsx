import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoAButton, GoANotification, GoAElementLoader } from '@abgov/react-components';
import { CreateTenant, IsTenantAdmin } from '@store/tenant/actions';
import { RootState } from '@store/index';
import GoALinkButton from '@components/LinkButton';
import { GoAForm, GoAFormActions, GoAFormItem } from '@abgov/react-components/experimental';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { KeycloakCheckSSO, TenantLogin } from '@store/tenant/actions';
import { TenantLogout } from '@store/tenant/actions';
import styled from 'styled-components';

const CreateRealm = (): JSX.Element => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [isLoaded, setIsLoaded] = useState(true);

  const onCreateRealm = async () => {
    dispatch(CreateTenant(name));
    handleIsLoadedToggle();
  };

  const onChangeName = (event) => {
    setName(event.target.value);
  };

  const handleIsLoadedToggle = () => {
    setIsLoaded((currentIsLoaded) => !currentIsLoaded);
  };

  const { isTenantAdmin, userInfo, isTenantCreated, tenantRealm, isInBeta, notifications } = useSelector(
    (state: RootState) => ({
      isTenantAdmin: state.tenant.isTenantAdmin,
      userInfo: state.session.userInfo,
      isTenantCreated: state.tenant.isTenantCreated,
      tenantRealm: state.tenant.realm,
      isInBeta: state.session.realmAccess?.roles?.includes('beta-tester'),
      notifications: state.notifications.notifications,
    })
  );

  useEffect(() => {
    dispatch(KeycloakCheckSSO('core'));
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, [notifications]);

  useEffect(() => {
    if (userInfo) {
      dispatch(IsTenantAdmin(userInfo.email));
    }
  }, [userInfo]);

  const ErrorMessage = (props) => {
    const message = `${props.email} has already created a tenant. Currently only one tenant is allowed per person.`;
    return (
      <div>
        <GoANotification type="information" title="Notification Title" message={message} />
        <GoAButton
          onClick={() => {
            dispatch(TenantLogout());
          }}
        >
          Back to main page
        </GoAButton>
      </div>
    );
  };
  const ButtonLoader = () => {
    return (
      <GoAButton buttonType="primary" buttonSize="normal" disabled>
        Creating Tenant...
        <GoAElementLoader visible={true} size="default" baseColour="#c8eef9" spinnerColour="#0070c4" />
      </GoAButton>
    );
  };

  const TenantCreated = () => {
    return (
      <>
        <p>The '{name}' has been successfully created</p>
        <GoAButton
          onClick={() => {
            dispatch(TenantLogin(tenantRealm));
          }}
        >
          Tenant Login
        </GoAButton>
      </>
    );
  };

  const TenantCreateView = () => {
    return (
      <>
        <GoALinkButton
          to=""
          onClick={() => {
            dispatch(TenantLogout());
          }}
          buttonType="secondary"
        >
          Back
        </GoALinkButton>
        <GoAButton onClick={onCreateRealm}>Create tenant</GoAButton>
      </>
    );
  };

  const ready = userInfo !== undefined && isTenantAdmin !== undefined;

  return (
    <CreateTenantStyle>
      <Page ready={ready}>
        {isInBeta ? (
          <>
            <Main>
              {isTenantAdmin === true && !isTenantCreated && <ErrorMessage email={userInfo.email} />}
              {isTenantCreated ? (
                <TenantCreated />
              ) : (
                <>
                  {isTenantAdmin === false ? (
                    <>
                      <h2>Create tenant</h2>
                      <p>
                        Current user email: <b>{userInfo.email}</b>
                      </p>
                      <p>
                        As a reminder, you are only able to create <b>one tenant</b> per user account.
                      </p>
                      <GoAForm>
                        <GoAFormItem error={notifications[notifications.length - 1]?.message}>
                          <label htmlFor="name">Tenant name</label>
                          <input id="name" type="text" value={name} onChange={onChangeName} />
                        </GoAFormItem>
                        <div style={{ lineHeight: '10px' }}>
                          <div className="helper-text">
                            {notifications[notifications.length - 1]?.message.includes('Names cannot contain')
                              ? ''
                              : 'Names cannot contain special characters (ex. ! % &).'}
                          </div>
                        </div>

                        <GoAFormActions alignment="left">
                          {isLoaded ? <TenantCreateView /> : <ButtonLoader />}
                        </GoAFormActions>
                      </GoAForm>
                    </>
                  ) : null}
                </>
              )}
            </Main>
            <Aside>
              <SupportLinks />
            </Aside>
          </>
        ) : (
          <Main>
            <h1 className="thin-font">Tenant creation failed</h1>
            <p>
              <b>{userInfo?.email}</b> does not have the "beta tester" role. You require the "beta-tester" role to
              create a tenant.
            </p>
            <div className="padding-bottom-2">
              Please contact <a href="mailto: DIO@gov.ab.ca">DIO@gov.ab.ca</a> for more information.
            </div>
            <GoALinkButton buttonType="primary" onClick={() => dispatch(TenantLogout())} to="">
              Back to sign in page
            </GoALinkButton>
          </Main>
        )}
      </Page>
    </CreateTenantStyle>
  );
};

export default CreateRealm;

const CreateTenantStyle = styled.div`
  .error-msg {
    color: #ec040b !important;
    line-height: 20px;
    font-size: 13px;
  }

  .goa-form-item {
    margin-bottom: 0;
  }

  .helper-text {
    margin-top: 0.2rem;
    font-size: 13px;
  }

  .goa-form-item.error input {
    border-color: #ec040b;
  }
`;
