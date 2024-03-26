import React, { useEffect, useState } from 'react';
import {
  GoAInput,
  GoAFormItem,
  GoAButton,
  GoANotification,
  GoASpacer,
  GoABadge,
  GoACircularProgress,
} from '@abgov/react-components-new';
import { useDispatch } from 'react-redux';
import { FetchUserIdByEmail, FETCH_USER_ID_BY_EMAIL, DeleteUserIdp, DELETE_USER_IDP } from '@store/tenant/actions';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { findActionState } from '@store/session/selectors';
import { LoadingState } from '@store/session/models';
import { useValidators } from '@lib/validation/useValidators';
import { characterCheck, validationPattern } from '@lib/validation/checkInput';
import { DeleteModal } from '@components/DeleteModal';
import { LoadingIndicatorContainer } from './styled-component';

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
  const [openModal, setOpenModal] = useState<boolean>(false);
  // eslint-disable-next-line
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
    setEmail('');
    setOpenModal(false);
    dispatch(DeleteUserIdp(fetchUserIdState?.id, 'core'));
  };

  return (
    <>
      <h2>Unexpected error when authenticating with identity provider</h2>
      <p>
        Known Issue - Government of Alberta AD user accounts are deleted and recreated in some cases. In such cases,
        users signing in with SSO account will encounter an identity provider error because their Keycloak account is
        linked to the previous AD account.
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
      <>
        <GoASpacer vSpacing="s"></GoASpacer>

        <GoAButton
          disabled={(fetchUserIdState?.state as unknown) === 'start'}
          testId={'user-search-email-btn'}
          onClick={searchUserByEmailHandler}
        >
          Search
        </GoAButton>
        <LoadingIndicatorContainer>
          <GoACircularProgress size="small" visible={(fetchUserIdState?.state as unknown) === 'start'} />
        </LoadingIndicatorContainer>
      </>

      {fetchedUserInfo && fetchUserIdState?.state === 'completed' && fetchUserIdState?.id === null && (
        <div>
          <GoASpacer vSpacing="m"></GoASpacer>
          <GoANotification type="information">{`Cannot find the ${email} in the core realm.`}</GoANotification>
        </div>
      )}

      {fetchedUserInfo && fetchUserIdState?.state === 'completed' && fetchUserIdState?.id?.length > 0 && (
        <GoAFormItem>
          <GoASpacer vSpacing="m"></GoASpacer>
          <p>Found {`${email} in core and tenant realms.`}</p>
          <p>
            {`The user id in core realm is: `}
            <GoABadge type="information" testId="user-idp-in-core-badge" content={`${fetchUserIdState?.id}`} />
          </p>

          {
            // eslint-disable-next-line
            (fetchUserIdState?.data as unknown as any)?.hasDefaultIdpInCore === true && (
              <>
                <p>The related ADSP default IdP link in the core realm is found.</p>
                <GoAButton
                  testId="delete-core-idp-btn"
                  disabled={(fetchUserIdState?.state as unknown) === 'start' || deletedUserIdp}
                  variant="destructive"
                  onClick={() => {
                    setOpenModal(true);
                  }}
                >
                  Delete
                </GoAButton>
              </>
            )
          }

          {
            // eslint-disable-next-line
            (fetchUserIdState?.data as unknown as any)?.hasDefaultIdpInCore !== true && (
              <p>
                We have <b>NOT</b> found the ADSP default IdP link of the user in the core realm.
              </p>
            )
          }
        </GoAFormItem>
      )}

      {openModal && (
        <DeleteModal
          title="Delete IdP link"
          data-testid="delete-idp-in-core-modal"
          content={
            <>
              <p>Delete the IdP link in core realm cannot be undone.</p>
              <p>
                <b>Are you sure you want to continue?</b>
              </p>
            </>
          }
          onCancel={() => {
            setOpenModal(false);
          }}
          isOpen={openModal}
          onDelete={deleteUserIdPHandler}
        />
      )}
    </>
  );
};
