import React, { useEffect, useState } from 'react';
import { GoabBadge, GoabCallout } from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { AppDispatch } from '@store/index';
import { getAccessScope } from '@store/agent/actions';
import { AccessScope } from '@store/agent/model';

interface ScopeState {
  loading: boolean;
  scope?: AccessScope;
  failed?: boolean;
}

const REALM_KIND_LABELS = { tenant: 'Tenant', core: 'Core' };

/**
 * Shows which Access Service environment and realm the user can inspect. Decided by agent-service from the
 * user's token without AI, so it is accurate even before the chat connects or when the user lacks a role.
 */
export const AccessScopeBanner = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [state, setState] = useState<ScopeState>({ loading: true });

  useEffect(() => {
    let active = true;
    dispatch(getAccessScope())
      .then((scope) => active && setState({ loading: false, scope }))
      .catch(() => active && setState({ loading: false, failed: true }));

    return () => {
      active = false;
    };
  }, [dispatch]);

  if (state.loading) {
    return (
      <ScopePanel data-testid="access-scope-banner" data-status="loading">
        Checking what you can inspect…
      </ScopePanel>
    );
  }

  const { scope } = state;
  if (state.failed || !scope) {
    return (
      <div data-testid="access-scope-banner" data-status="error">
        <GoabCallout type="important" size="medium" heading="Could not check your access scope" mb="none">
          Live inspection may not work right now. The assistant can still answer general questions.
        </GoabCallout>
      </div>
    );
  }

  if (scope.status !== 'available') {
    return (
      <div data-testid="access-scope-banner" data-status="unavailable" data-reason={scope.reason}>
        <GoabCallout type="important" size="medium" heading="Live inspection is not available" mb="none">
          <p>{scope.message}</p>
          {scope.missingRoles && scope.missingRoles.length > 0 && (
            <p>
              Missing role: <code>{scope.missingRoles.join(', ')}</code>
            </p>
          )}
        </GoabCallout>
      </div>
    );
  }

  return (
    <ScopePanel data-testid="access-scope-banner" data-status="available">
      <ScopeHeading>
        <strong>Your scope</strong>
        <GoabBadge type="information" content="Read-only" icon={false} testId="access-scope-read-only" />
      </ScopeHeading>
      <dl>
        <dt>Environment</dt>
        <dd data-testid="access-scope-environment">{scope.environment?.label}</dd>
        <dt>Keycloak host</dt>
        <dd data-testid="access-scope-host">
          <code>{scope.environment?.host}</code>
        </dd>
        <dt>Realm ID</dt>
        <dd data-testid="access-scope-realm">
          <code>{scope.realm?.id}</code>
        </dd>
        <dt>Realm type</dt>
        <dd data-testid="access-scope-realm-kind">{REALM_KIND_LABELS[scope.realm?.kind] ?? 'Unknown'}</dd>
      </dl>
    </ScopePanel>
  );
};

const ScopePanel = styled.div`
  box-sizing: border-box;
  padding: var(--goa-space-s) var(--goa-space-m);
  border-left: 3px solid var(--goa-color-info-default);
  border-radius: var(--goa-border-radius-s);
  background-color: var(--goa-color-greyscale-100);
  font-size: var(--goa-font-size-2);

  &[data-status='loading'] {
    color: var(--goa-color-text-secondary);
  }

  & dl {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: var(--goa-space-2xs) var(--goa-space-s);
    margin: var(--goa-space-xs) 0 0 0;
  }

  & dt {
    font-weight: 600;
    color: var(--goa-color-greyscale-700);
  }

  & dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  & code {
    font-size: var(--goa-font-size-1);
  }
`;

const ScopeHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-s);
`;
