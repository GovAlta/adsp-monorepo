import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AccessServiceCheck, AccessUserComparison } from '@store/agent/model';
import { ComparedPeopleSuggestions, ServiceChecks, UserComparison } from './AccessCheckResults';

const FORM_SERVICE = 'urn:ads:platform:form-service';
const TENANT_SERVICE = 'urn:ads:platform:tenant-service';

const check: AccessServiceCheck = {
  service: FORM_SERVICE,
  rolesFrom: 'platform',
  roles: [
    {
      role: 'form-admin',
      description: 'Administers forms.',
      inTenantAdmin: true,
      has: true,
      sources: [{ type: 'composite', via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] }],
    },
    { role: 'form-applicant', has: false, sources: [] },
  ],
  otherRoles: [{ role: 'form-tester', sources: [{ type: 'direct' }] }],
};

function rows(element: HTMLElement): string[][] {
  return Array.from(element.querySelectorAll('tbody tr')).map((row) =>
    Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent),
  );
}

describe('ServiceChecks', () => {
  it('shows each role of the service with whether it is held and how', () => {
    const { getByTestId } = render(<ServiceChecks services={[check]} />);

    const card = getByTestId(`access-service-check-${FORM_SERVICE}`);
    expect(card).toHaveTextContent('ADSP platform service · has 1 of 2 roles');
    expect(rows(card)).toEqual([
      [
        'form-admin — Administers forms. (included in tenant-admin)',
        'Yes',
        `Inherited via tenant-admin (${TENANT_SERVICE})`,
      ],
      ['form-applicant', 'No', '—'],
    ]);
    expect(card).toHaveTextContent('Other roles held on this service: form-tester (Assigned directly)');
    expect(card.querySelectorAll('th')).toHaveLength(3);
  });

  it("adds whether each role and the audience reach the app's token", () => {
    const { getByTestId } = render(
      <ServiceChecks
        services={[
          {
            ...check,
            roles: check.roles.map((role) => ({ ...role, inToken: role.has })),
            token: { app: 'urn:ads:demo:app', audienceIncluded: false },
          },
        ]}
      />,
    );

    expect(getByTestId('access-service-check-audience')).toHaveTextContent(
      'Token from urn:ads:demo:app is not meant for this service (audience missing)',
    );
    expect(rows(getByTestId(`access-service-check-${FORM_SERVICE}`)).map((row) => row[3])).toEqual(['Yes', 'No']);
  });

  it('says when a service defines no roles', () => {
    const { getByText } = render(<ServiceChecks services={[{ ...check, roles: [], otherRoles: [] }]} />);

    expect(getByText('This service defines no roles.')).toBeInTheDocument();
  });
});

describe('UserComparison', () => {
  const comparison: AccessUserComparison = {
    onlyFirst: [{ name: 'tenant-admin', client: TENANT_SERVICE, sources: [{ type: 'direct' }] }],
    onlySecond: [],
    sharedCount: 4,
    groups: { onlyFirst: ['/tenant-admins'], onlySecond: [] },
  };

  it('shows only what each person has that the other does not', () => {
    const { getByTestId } = render(
      <UserComparison
        first={{ search: 'Jane', user: { id: '1', username: 'jdoe', requiredActions: [], identityProviders: [] } }}
        second={{ search: 'sam' }}
        comparison={comparison}
      />,
    );

    const card = getByTestId('access-user-comparison');
    expect(card).toHaveTextContent('4 roles in common.');
    expect(card).toHaveTextContent('Only jdoe has');
    expect(getByTestId('access-comparison-only-first')).toHaveTextContent(
      `tenant-admin (${TENANT_SERVICE}) — Assigned directly`,
    );
    expect(getByTestId('access-comparison-only-second')).toHaveTextContent('None.');
    expect(card).toHaveTextContent('Groups only jdoe is in/tenant-admins');
  });
});

describe('ComparedPeopleSuggestions', () => {
  it('lists the choices for each person who was not found exactly', () => {
    const { getByTestId } = render(
      <ComparedPeopleSuggestions people={[{ search: 'al', suggestions: ['alice', 'alan'] }, { search: 'sam' }]} />,
    );

    expect(getByTestId('access-comparison-suggestions')).toHaveTextContent('For “al”: alice, alan');
  });

  it('renders nothing when everyone was found', () => {
    const { container } = render(<ComparedPeopleSuggestions people={[{ search: 'sam' }]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
