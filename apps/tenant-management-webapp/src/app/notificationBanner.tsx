import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { GoabNotification } from '@abgov/react-components';
import { DismissNotification } from '@store/notifications/actions';
import { MessageType } from '@store/notifications/models';
import { formatSupportDetails, SupportDetails } from '@store/notifications/errors';
import { SUPPORT_EMAIL } from '@components/SupportLinks';
import styled from 'styled-components';

export function NotificationBanner(): JSX.Element {
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1],
  );
  const tenantName = useSelector((state: RootState) => state.tenant?.name);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!latestNotification || latestNotification.disabled || latestNotification.type !== MessageType.success) {
      return;
    }
    const delay = Math.max((latestNotification.expiry ?? Date.now()) - Date.now(), 0);
    const timer = setTimeout(() => dispatch(DismissNotification(latestNotification)), delay);
    return () => clearTimeout(timer);
  }, [latestNotification, dispatch]);

  return (
    <div style={{ marginBottom: '10px' }}>
      {latestNotification && !latestNotification.disabled && (
        <GoabNotification
          key={latestNotification.id}
          type={latestNotification.type || 'emergency'}
          onDismiss={() => dispatch(DismissNotification(latestNotification))}
        >
          <NotificationStyles>
            <div>{latestNotification.message}</div>
            {latestNotification.details && (
              <SupportDetailsSection
                message={latestNotification.message}
                details={{ ...latestNotification.details, tenant: tenantName || undefined }}
              />
            )}
          </NotificationStyles>
        </GoabNotification>
      )}
    </div>
  );
}

interface SupportDetailsSectionProps {
  message: string;
  details: SupportDetails;
}

function SupportDetailsSection({ message, details }: SupportDetailsSectionProps): JSX.Element {
  const text = formatSupportDetails(details);
  const subject = encodeURIComponent('Tenant admin error');
  const body = encodeURIComponent(`${message}\n\n${text}`);

  return (
    <details>
      <summary>Details for support</summary>
      <pre data-testid="support-details-text">{text}</pre>
      <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}>Email these details to support</a>
    </details>
  );
}

export const NotificationStyles = styled.div`
  details {
    margin-top: var(--goa-space-xs);
  }

  summary {
    cursor: pointer;
  }

  pre {
    margin: var(--goa-space-xs) 0 !important;
    padding: 0 !important;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: var(--goa-font-size-2);
  }

  a {
    color: inherit;
  }
`;
