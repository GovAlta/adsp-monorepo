import React, { useEffect, useState } from 'react';
import { GoAInput, GoAFormItem, GoAButton, GoANotification, GoASpacer } from '@abgov/react-components-new';
import { useDispatch } from 'react-redux';
import { FetchUserIdByEmail, FETCH_USER_ID_BY_EMAIL, DeleteUserIdp } from '@store/tenant/actions';
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
  const fetchUserIdState: LoadingState = useSelector((state: RootState) =>
    findActionState(state, FETCH_USER_ID_BY_EMAIL)
  );
  const emailValidator = characterCheck(validationPattern.validEmail);
  const { errors, validators } = useValidators('email', 'email', emailValidator).build();
  console.log(fetchUserIdState?.state);

  useEffect(() => {}, [fetchUserIdState]);

  // console.log(fetchUserIdState);
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
          testId={'user-email'}
          onChange={(name, value) => {
            if (errors['email']) {
              validators.clear();
            }
            setEmail(value);
          }}
        ></GoAInput>
      </GoAFormItem>
      <div>
        <GoASpacer vSpacing="s"></GoASpacer>

        <GoAButton
          disabled={(fetchUserIdState?.state as unknown) === 'start'}
          onClick={() => {
            const validations = {
              email,
            };

            if (!validators.checkAll(validations)) {
              return;
            }
            setFetchedUserInfo(true);
            dispatch(FetchUserIdByEmail(email));
          }}
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
          <GoANotification type="information">{`Found the user in the core realm. Are you going to delete goa-ad IdP in the core realm?`}</GoANotification>
          <GoAButton
            disabled={(fetchUserIdState?.state as unknown) === 'start'}
            variant="destructive"
            onClick={() => {
              dispatch(DeleteUserIdp(fetchUserIdState?.id, 'core'));
            }}
          >
            Delete
          </GoAButton>
        </GoAFormItem>
      )}
    </>
  );
};
