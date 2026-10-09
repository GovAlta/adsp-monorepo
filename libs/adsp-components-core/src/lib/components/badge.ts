import type { AdspThemeColor } from '../theme/adsp-theme';

export type AdspBadgeType = keyof AdspThemeColor['status'];

export interface AdspBadgeTheme {
  borderRadius: string;
  textColor: string;
  statusColor: Record<AdspBadgeType, string>;
}

export const defaultBadgeTheme: AdspBadgeTheme = {
  borderRadius: 'var(--adsp-border-radius-round)',
  textColor: 'var(--adsp-color-text-default)',
  statusColor: {
    success: 'var(--adsp-color-status-success)',
    info: 'var(--adsp-color-status-info)',
    important: 'var(--adsp-color-status-important)',
    emergency: 'var(--adsp-color-status-emergency)',
  },
};
