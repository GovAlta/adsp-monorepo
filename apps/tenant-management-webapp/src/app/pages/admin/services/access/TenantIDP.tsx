import React, { useState } from 'react';
import { GoAInput, GoAFormItem, GoAButton } from '@abgov/react-components-new';
import { useDispatch } from 'react-redux';
import { FetchUserIdByEmail } from '@store/tenant/actions';

export const TenantIdp = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  return (
    <>
      <GoAFormItem label="Email">
        <GoAInput
          value={email}
          name="user-email"
          type="email"
          testId={'user-email'}
          onChange={(name, value) => {
            setEmail(value);
          }}
        ></GoAInput>
      </GoAFormItem>
      <GoAButton
        onClick={() => {
          dispatch(FetchUserIdByEmail(email));
        }}
      >
        Search
      </GoAButton>
    </>
  );
};
