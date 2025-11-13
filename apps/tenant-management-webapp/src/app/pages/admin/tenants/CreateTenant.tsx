import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { GoANotification, GoAButton, GoAInput, GoAFormItem, GoAButtonGroup } from '@abgov/react-components';
import { CreateTenant, IsTenantAdmin } from '@store/tenant/actions';
import { RootState } from '@store/index';
import GoALinkButton from '@components/LinkButton';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { KeycloakCheckSSO, TenantLogin } from '@store/tenant/actions';
import { TenantLogout } from '@store/tenant/actions';
import { PageLoader } from '@core-services/app-common';
const CreateRealm = (): JSX.Element => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [isLoaded, setIsLoaded] = useState(true);

  const onCreateRealm = async () => {
    dispatch(CreateTenant(name));
    handleIsLoadedToggle();
  };

  const onChangeName = (name: string, value: string) => {
    setName(value);
  };

  const handleIsLoadedToggle = () => {
    setIsLoaded((isLoaded) => !isLoaded);
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
  }, [dispatch]);

  useEffect(() => {
    setIsLoaded(true);
  }, [notifications]);

  useEffect(() => {
    if (userInfo) {
      dispatch(IsTenantAdmin(userInfo.email));
    }
  }, [userInfo, dispatch]);

  const ErrorMessage = (props) => {
    const Message = () => {
      return (
        <>
          {props.email} has already created a tenant. Currently, one GoA staff is only allowed to create one tenant
          through ADSP website. If you need to create another tenant using the same email, please send your request to{' '}
          <a href="mailto:adsp@gov.ab.ca">adsp@gov.ab.ca</a> or #adsp-connections on slack.
        </>
      );
    };

    return (
      <div>
        <GoANotification type="information">
          <Message />
        </GoANotification>
        <br />
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
        <GoAButton onClick={onCreateRealm} disabled={name.length === 0}>
          Create tenant
        </GoAButton>
      </>
    );
  };

  const ready = userInfo !== undefined && isTenantAdmin !== undefined;

  return (
    <Page ready={ready}>
      {isInBeta ? (
        <>
          <Main>
            {isTenantAdmin === true && !isTenantCreated && <ErrorMessage email={userInfo.email} />}
            {isTenantCreated ? (
              <TenantCreated />
            ) : (
              // eslint-disable-next-line react/jsx-no-useless-fragment
              <>
                {isTenantAdmin === false && (
                  <>
                    <h2>Create tenant</h2>
                    <p>
                      Current user email: <b>{userInfo.email}</b>
                    </p>
                    <p>
                      As a reminder, you are only able to create <b>one tenant</b> per user account.
                    </p>

                    <GoAFormItem error={notifications[notifications.length - 1]?.message} label="Tenant name">
                      <GoAInput
                        name="name"
                        testId="name-input"
                        id="name"
                        type="text"
                        value={name}
                        width="100%"
                        onChange={onChangeName}
                      />
                    </GoAFormItem>
                    <GoAButtonGroup alignment="start">
                      {isLoaded ? (
                        <TenantCreateView />
                      ) : (
                        <PageLoader size="small" message={`Creating tenant for ${name} ... `} />
                      )}
                    </GoAButtonGroup>
                  </>
                )}
              </>
            )}
          </Main>
          <Aside>
            <SupportLinks />
          </Aside>
        </>
      ) : (
        <Main>
          <h1>Tenant creation failed</h1>
          <p>
            <b>{userInfo?.email}</b> does not have the "beta tester" role. You require the "beta-tester" role to create
            a tenant.
          </p>
          <div style={{ marginBottom: '1.5rem' }}>
            Please contact <a href="mailto: adsp@gov.ab.ca">adsp@gov.ab.ca</a> for more information.
          </div>
          <GoALinkButton buttonType="primary" onClick={() => dispatch(TenantLogout())} to="">
            Back to sign in page
          </GoALinkButton>
        </Main>
      )}
    </Page>
  );
};

export default CreateRealm;
