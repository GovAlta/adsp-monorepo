import React, { useState } from 'react';

import Header from '../appHeader';
import Container from '@components/_/Container';
import { GoAForm, GoAFormButtons, GoAFormItem } from '@components/_/Form';
import GoALinkButton from '@components/_/LinkButton';

// FIXME: Can this component be deleted?
const LoginLanding = () => {
  const [tenantName, setTenantName] = useState<string>();

  return (
    <>
      <Header hasLoginLink={false} />
      <Container>
        <GoAForm>
          <GoAFormItem>
            <label>Please enter tenant Name:</label>
            <input
              onChange={(event): void => {
                setTenantName(event.target.value);
              }}
            />
          </GoAFormItem>

          <GoAFormButtons>
            <GoALinkButton to={`/${tenantName}/login`} buttonType="primary">
              Tenant Login
            </GoALinkButton>
          </GoAFormButtons>
        </GoAForm>
      </Container>
    </>
  );
};

export default LoginLanding;
