import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

export function useHasRole(role: string, clientId = 'urn:ads:platform:notification-service'): boolean {
  return useSelector((state: RootState) => state.session?.resourceAccess?.[clientId]?.roles?.includes(role) ?? false);
}
