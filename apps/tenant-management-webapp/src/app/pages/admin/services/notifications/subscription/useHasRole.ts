import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

export function useHasRole(role: string, clientId = 'urn:ads:platform:notification-service'): boolean {
  return useSelector((state: RootState) => state.session?.resourceAccess?.[clientId]?.roles?.includes(role) ?? false);
}

export function useCanEditContact(): boolean {
  const hasSubscriptionAdmin = useHasRole('subscription-admin');
  const hasConfigurationAdmin = useHasRole('configuration-admin', 'urn:ads:platform:configuration-service');
  return hasSubscriptionAdmin || hasConfigurationAdmin;
}
