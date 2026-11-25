import { RootState } from '@store/index';
import { DEFAULT_SUPPORT_EMAIL } from './models';

/** Falls back to the platform address before config loads, or when the ConfigMap doesn't set one. */
export const selectSupportEmail = (state: RootState): string => state.config?.supportEmail || DEFAULT_SUPPORT_EMAIL;
