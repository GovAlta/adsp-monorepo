import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/index';
import { useNavigate } from 'react-router-dom';
import { GoAButton } from '@abgov/react-components';
import { TenantBasicInfo } from '@store/tenant/models';

export const SelectTenant = (): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { adminInTenants } = useSelector((state: RootState) => ({
    adminInTenants: state.tenant.adminInTenants as unknown as TenantBasicInfo[],
  }));
  return (
    <>
      <h2>Please choose the tenant you want to login</h2>
      {adminInTenants?.map((tenant) => (
        <div key={tenant.realm}>
          <div>
            <div>
              <b>Tenant Name:</b> {tenant.name} <br /> <b>Realm:</b> {tenant.realm}
            </div>
            <GoAButton
              type="primary"
              testId={`${tenant.realm}-login-button`}
              onClick={() => {
                navigate(`/${tenant.realm}/login`);
              }}
            >
              Login
            </GoAButton>
            <br /> <br />
          </div>
        </div>
      ))}
    </>
  );
};
