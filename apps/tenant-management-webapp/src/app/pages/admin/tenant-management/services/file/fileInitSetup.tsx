import { GoAButton } from '@abgov/react-components';
import React from 'react';
import { useDispatch } from 'react-redux';
import { CreateTenantConfigService } from '@store/tenantConfig/actions';

const InitSetup = () => {
  const dispatch = useDispatch();
  return (
    <div>
      <p>
        The file service provides the capability to upload and download files. Consumers are registered with their own
        space (tenant) containing file types that include role based access policy, and can associate files to domain
        records.
      </p>
      <GoAButton content="Setup Service" onClick={() => dispatch(CreateTenantConfigService())}>
        Setup Service
      </GoAButton>
    </div>
  );
};

export default InitSetup;
