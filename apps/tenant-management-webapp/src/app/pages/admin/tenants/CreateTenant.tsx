////
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoAButton, GoANotification, GoAElementLoader } from '@abgov/react-components';
import { CreateTenant, IsTenantAdmin } from '@store/tenant/actions';
import { RootState } from '@store/index';
import GoALinkButton from '@components/LinkButton';
import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/Form';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { KeycloakCheckSSO, TenantLogin } from '@store/tenant/actions';
import { TenantLogout } from '@store/tenant/actions';

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

  const { isTenantAdmin, userInfo, isTenantCreated, tenantRealm } = useSelector((state: RootState) => ({
    isTenantAdmin: state.tenant.isTenantAdmin,
    userInfo: state.session.userInfo,
    isTenantCreated: state.tenant.isTenantCreated,
    tenantRealm: state.tenant.realm,
  }));

  useEffect(() => {
    dispatch(KeycloakCheckSSO('core'));
  });

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
        <GoAElementLoader visible={true} size={15} baseColour="#c8eef9" spinnerColour="#0070c4" />
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
        <GoAButton onClick={onCreateRealm}>Create Tenant</GoAButton>
      </>
    );
  };

  const ready = userInfo !== undefined && isTenantAdmin !== undefined;

  return (
    <Page ready={ready}>
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
                <p>As a reminder, you are only able to create one tenant per user account.</p>
                <GoAForm>
                  <GoAFormItem>
                    <label htmlFor="name">Tenant Name</label>
                    <input id="name" type="text" value={name} onChange={onChangeName} />
                    <em>Names cannot container special characters (ex. ! % &amp;)</em>
                  </GoAFormItem>

                  <GoAFormButtons>{isLoaded ? <TenantCreateView /> : <ButtonLoader />}</GoAFormButtons>
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
