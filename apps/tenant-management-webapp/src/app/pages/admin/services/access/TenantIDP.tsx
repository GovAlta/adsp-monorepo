import React, { useEffect, useState } from 'react';
import { GoAInput, GoAFormItem, GoAButton, GoANotification, GoASpacer } from '@abgov/react-components-new';
import { useDispatch } from 'react-redux';
import { FetchUserIdByEmail, FETCH_USER_ID_BY_EMAIL, DeleteUserIdp, DELETE_USER_IDP } from '@store/tenant/actions';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { findActionState } from '@store/session/selectors';
import { LoadingState } from '@store/session/models';
import { useValidators } from '@lib/validation/useValidators';
import { characterCheck, validationPattern } from '@lib/validation/checkInput';
export const TenantIdp = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();

  const [fetchedUserInfo, setFetchedUserInfo] = useState(false);
  const [deletedUserIdp, setDeletedUserIdp] = useState(false);

  const fetchUserIdState: LoadingState = useSelector((state: RootState) =>
    findActionState(state, FETCH_USER_ID_BY_EMAIL)
  );

  const deleteUserIdpState: LoadingState = useSelector((state: RootState) => findActionState(state, DELETE_USER_IDP));
  const emailValidator = characterCheck(validationPattern.validEmail);
  const { errors, validators } = useValidators('email', 'email', emailValidator).build();

  useEffect(() => {}, [fetchUserIdState, deleteUserIdpState]);

  const searchUserByEmailHandler = () => {
    const validations = {
      email,
    };

    if (!validators.checkAll(validations)) {
      return;
    }
    setFetchedUserInfo(true);
    setDeletedUserIdp(false);
    dispatch(FetchUserIdByEmail(email));
  };

  const InputUserEmailHandler = (name, value) => {
    if (errors['email']) {
      validators.clear();
    }
    setEmail(value);
  };

  const deleteUserIdPHandler = () => {
    setDeletedUserIdp(true);
    dispatch(DeleteUserIdp(fetchUserIdState?.id, 'core'));
  };

  return (
    <>
      <p>
        The IdP of ADSP GoA SSO in the tenant realm is linked to the GoA Azure AD through the corresponding IdP in the
        ADSP Keycloak core realm. The IdP in the core realm needs to be re-synced with the Azure AD when the user
        identity in the Azure AD is updated. Currently, we need to delete the old IdP in the core realm manually for the
        synchronization. The tool below enables the tenant admins to delete the IdP in core realm by themselves.
      </p>
      <GoAFormItem label="Email" error={`${errors['email'] || ''}`}>
        <GoAInput
          value={email}
          name="user-email"
          type="email"
          testId={'user-search-email-input'}
          onChange={InputUserEmailHandler}
        ></GoAInput>
      </GoAFormItem>
      <div>
        <GoASpacer vSpacing="s"></GoASpacer>

        <GoAButton
          disabled={(fetchUserIdState?.state as unknown) === 'start'}
          testId={'user-search-email-btn'}
          onClick={searchUserByEmailHandler}
        >
          Search
        </GoAButton>
      </div>

      {fetchedUserInfo && fetchUserIdState?.state === 'completed' && fetchUserIdState?.id === null && (
        <div>
          <GoASpacer vSpacing="m"></GoASpacer>
          <GoANotification type="information">{`Cannot find the ${email} in the core realm.`}</GoANotification>
        </div>
      )}

      {fetchedUserInfo && fetchUserIdState?.state === 'completed' && fetchUserIdState?.id?.length > 0 && (
        <GoAFormItem>
          <GoASpacer vSpacing="m"></GoASpacer>
          <p>
            We found the user in the core realm. Are you going to delete the goa-ad IdP from the user in the core realm?
          </p>
          <GoAButton
            disabled={(fetchUserIdState?.state as unknown) === 'start' || deletedUserIdp}
            variant="destructive"
            onClick={deleteUserIdPHandler}
          >
            Delete
          </GoAButton>

          {deletedUserIdp && deleteUserIdpState?.state === 'completed' && (
            <div>
              <GoASpacer vSpacing="m"></GoASpacer>
              The user goa-ad IdP was deleted from the core realm successfully.
            </div>
          )}

          {deletedUserIdp && deleteUserIdpState?.state === 'error' && (
            <div>
              <GoASpacer vSpacing="m"></GoASpacer>
              <span>{`${deleteUserIdpState?.data}`}</span>
            </div>
          )}
        </GoAFormItem>
      )}
    </>
  );
};
