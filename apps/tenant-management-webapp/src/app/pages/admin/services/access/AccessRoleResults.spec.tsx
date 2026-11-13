import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleDetails, RoleMembers, ServiceRoleCatalog } from './AccessRoleResults';

const FORM_SERVICE = 'urn:ads:platform:form-service';
const TENANT_SERVICE = 'urn:ads:platform:tenant-service';

function definitionValue(container: HTMLElement, term: string): string | null {
  const dt = Array.from(container.querySelectorAll('dt')).find((element) => element.textContent === term);
  return dt?.nextElementSibling?.textContent ?? null;
}

describe('ServiceRoleCatalog', () => {
  it('lists each service with its roles, opening the only service shown', () => {
    const { getByTestId } = render(
      <ServiceRoleCatalog
        services={[
          {
            service: FORM_SERVICE,
            source: 'platform',
            roles: [{ role: 'form-admin', description: 'Administers forms.', inTenantAdmin: true }],
          },
        ]}
      />,
    );

    const details = getByTestId('access-service-roles').querySelector('details');
    expect(details).toHaveAttribute('open');
    expect(details.querySelector('summary')).toHaveTextContent(`${FORM_SERVICE} (1) · ADSP platform`);
    expect(details).toHaveTextContent('form-admin — Administers forms. (included in tenant-admin)');
  });

  it('collapses services when several are shown', () => {
    const entry = { service: FORM_SERVICE, source: 'platform' as const, roles: [] };
    const { getByTestId } = render(
      <ServiceRoleCatalog services={[entry, { ...entry, service: TENANT_SERVICE, source: 'tenant' }]} />,
    );

    const all = Array.from(getByTestId('access-service-roles').querySelectorAll('details'));
    expect(all.map((details) => details.hasAttribute('open'))).toEqual([false, false]);
    expect(all[1].querySelector('summary')).toHaveTextContent('Your tenant');
  });
});

describe('RoleDetails', () => {
  it('explains what a role is for and which role bundles give it', () => {
    const { container, getByTestId } = render(
      <RoleDetails
        role={{
          name: 'form-admin',
          client: FORM_SERVICE,
          description: 'Administers forms.',
          composite: false,
          inTenantAdmin: true,
          includes: [],
          includedIn: [
            { name: 'tenant-admin', client: TENANT_SERVICE, via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] },
            {
              name: 'super-admin',
              via: [{ name: 'super-admin' }, { name: 'tenant-admin', client: TENANT_SERVICE }],
            },
          ],
        }}
      />,
    );

    expect(definitionValue(container, 'Belongs to')).toBe(FORM_SERVICE);
    expect(definitionValue(container, 'What it is for')).toBe('Administers forms.');
    expect(definitionValue(container, 'Role bundle')).toBe('No');
    expect(definitionValue(container, 'Included in tenant-admin')).toBe('Yes');
    expect(getByTestId('access-role-included-in')).toHaveTextContent(
      `tenant-admin (${TENANT_SERVICE})super-admin (through tenant-admin (${TENANT_SERVICE}))`,
    );
  });

  it('describes a tenant-wide role bundle and what it includes', () => {
    const { container, getByText } = render(
      <RoleDetails
        role={{ name: 'default-roles', composite: true, includes: [{ name: 'offline_access' }], includedIn: [] }}
      />,
    );

    expect(definitionValue(container, 'Belongs to')).toBe('The whole realm (tenant-wide role)');
    expect(definitionValue(container, 'Role bundle')).toBe('Yes, it includes 1 roles');
    expect(getByText('Only assigning this role directly, or to a group, gives it.')).toBeInTheDocument();
  });
});

describe('RoleMembers', () => {
  it('lists holders by username with how they hold the role', () => {
    const { getByTestId } = render(
      <RoleMembers
        members={[
          { username: 'zed', serviceAccount: false, sources: [{ type: 'direct' }] },
          { username: 'service-account-api', serviceAccount: true, sources: [{ type: 'group', group: '/apis' }] },
          { username: 'old', serviceAccount: false, enabled: false, sources: [{ type: 'direct' }] },
        ]}
        counts={{ direct: 2, group: 1, composite: 0 }}
      />,
    );

    const card = getByTestId('access-role-members');
    expect(card).toHaveTextContent('2 assigned directly · 1 through a group · 0 through a role bundle');
    expect(Array.from(card.querySelectorAll('tbody tr')).map((row) => row.textContent)).toEqual([
      'zedAssigned directly',
      'service-account-api (app service account)Assigned to group /apis',
      'old (turned off)Assigned directly',
    ]);
  });

  it('says when the list is cut short or empty', () => {
    const { getByTestId, getByText } = render(<RoleMembers members={[]} truncated />);

    expect(getByTestId('access-role-members-truncated')).toBeInTheDocument();
    expect(getByText('Nobody holds this role.')).toBeInTheDocument();
  });
});
