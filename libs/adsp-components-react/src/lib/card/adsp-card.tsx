import { type ReactNode } from 'react';
import { type AdspComponentThemeOverrides } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';

export interface AdspCardProps {
  heading: string;
  children?: ReactNode;
  themeOverrides?: AdspComponentThemeOverrides<'card'>;
  testId?: string;
}

export function AdspCard({ heading, children, themeOverrides, testId }: AdspCardProps) {
  const themeStyle = useAdspThemeStyle('card', themeOverrides);

  return (
    <section className="adsp-card" style={themeStyle} data-testid={testId}>
      <h3 className="adsp-card__heading">{heading}</h3>
      <div className="adsp-card__body">{children}</div>
    </section>
  );
}
