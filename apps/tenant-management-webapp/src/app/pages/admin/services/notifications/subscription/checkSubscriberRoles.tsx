import { RootState } from '@store/index';
import { GoACallout } from '@abgov/react-components';
import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';

interface privateAppProps {
  children: ReactNode;
}

export function CheckSubscriberRoles({ children }: privateAppProps): JSX.Element {
  const adminEmail = useSelector((state: RootState) => state.tenant.adminEmail);
  const hasNotificationAdminRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:notification-service']?.roles?.includes('subscription-admin')
  );

  const DefaultView = () => {
    return <>{children}</>;
  };

  const ErrorView = () => {
    return (
      <>
        <GoACallout type="important" data-testid="delete-modal">
          <h3>Access to subscriptions requires admin roles</h3>
          <p>
            You require the subscription-admin role to access notifications and will need to contact the administrator
            of the tenant at <a href={`mailto: ${adminEmail}`}>{adminEmail}</a>
          </p>
        </GoACallout>
      </>
    );
  };
  return <>{hasNotificationAdminRole ? <DefaultView /> : <ErrorView />}</>;
}
