import React, { useEffect, useState } from 'react';
import {
  GoAInput,
  GoAFormItem,
  GoAButton,
  GoASpacer,
  GoABadge,
  GoACircularProgress,
  GoAIconButton,
} from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import { FetchUserIdByEmail, FETCH_USER_ID_BY_EMAIL, DeleteUserIdp, DELETE_USER_IDP } from '@store/tenant/actions';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { findActionState } from '@store/session/selectors';
import { ResetLoadingState } from '@store/session/actions';

import { LoadingState } from '@store/session/models';
import { useValidators } from '@lib/validation/useValidators';
import { characterCheck, validationPattern } from '@lib/validation/checkInput';
import { DeleteModal } from '@components/DeleteModal';
import { LoadingIndicatorContainer } from './styled-component';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import { NoPaddingH2 } from '@components/AppHeader';

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
  const [copied, setCopied] = useState<string>('');
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

    if ((fetchUserIdState?.state as unknown) === 'completed') {
      dispatch(ResetLoadingState());
      setCopied('');
    }

    setEmail(value);
  };

  const deleteUserIdPHandler = () => {
    setDeletedUserIdp(true);
    setOpenModal(false);
    dispatch(DeleteUserIdp(fetchUserIdState?.id, 'core'));
  };

  const resetFormHandler = () => {
    setEmail('');
    setCopied('');
    dispatch(ResetLoadingState());
  };

  const copyUserIdHandler = () => {
    navigator.clipboard.writeText(fetchUserIdState?.id);
    setCopied(fetchUserIdState?.id);
  };

  return (
    <section>
      <NoPaddingH2>Unexpected error when authenticating with identity provider</NoPaddingH2>
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

      {fetchedUserInfo && fetchUserIdState?.state === 'completed' && !fetchUserIdState?.id && (
        <div>
          <GoASpacer vSpacing="m"></GoASpacer>
          <p>{`Cannot find user ${email}`}</p>
        </div>
      )}

      {fetchedUserInfo && fetchUserIdState?.state === 'completed' && fetchUserIdState?.id?.length > 0 && (
        <GoAFormItem>
          <GoASpacer vSpacing="m"></GoASpacer>
          <p>Found {`${email} in core and tenant realms.`}</p>
          <p>
            {`The user id in core realm is: `}
            <GoABadge
              type="information"
              testId="user-idp-in-core-badge"
              content={`${fetchUserIdState?.id}`}
              icon={false}
            />
            {copied !== fetchUserIdState?.id && (
              <GoAIconButton
                testId="copy-user-id-btn"
                variant="color"
                size="small"
                icon="copy"
                title="copy button"
                onClick={copyUserIdHandler}
              />
            )}
            {copied === fetchUserIdState?.id && <CheckmarkCircle size={'medium'} />}
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
              <p>The user is NOT linked to the GoA SSO.</p>
            )
          }
          <GoASpacer vSpacing="m"></GoASpacer>
          <GoAButton testId="reset-core-idp-btn" type="secondary" onClick={resetFormHandler}>
            Reset
          </GoAButton>
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
    </section>
  );
};
