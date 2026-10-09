import { type ReactNode } from 'react';
import { type AdspBadgeType, type AdspComponentThemeOverrides } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';

export interface AdspBadgeProps {
  type: AdspBadgeType;
  children: ReactNode;
  themeOverrides?: AdspComponentThemeOverrides<'badge'>;
  testId?: string;
}

export function AdspBadge({ type, children, themeOverrides, testId }: AdspBadgeProps) {
  const themeStyle = useAdspThemeStyle('badge', themeOverrides);

  return (
    <span className={`adsp-badge adsp-badge--${type}`} style={themeStyle} data-testid={testId}>
      {children}
    </span>
  );
}
