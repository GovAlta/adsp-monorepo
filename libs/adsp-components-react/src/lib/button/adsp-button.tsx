import { type ButtonHTMLAttributes } from 'react';
import { type AdspButtonVariant, type AdspComponentThemeOverrides } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';

// No className or style: restyle through the theme or themeOverrides, which accept design tokens only.
export interface AdspButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'> {
  variant?: AdspButtonVariant;
  themeOverrides?: AdspComponentThemeOverrides<'button'>;
  testId?: string;
}

export function AdspButton({
  variant = 'primary',
  type = 'button',
  themeOverrides,
  testId,
  children,
  ...buttonProps
}: AdspButtonProps) {
  const themeStyle = useAdspThemeStyle('button', themeOverrides);

  return (
    <button
      {...buttonProps}
      type={type}
      className={`adsp-button adsp-button--${variant}`}
      style={themeStyle}
      data-testid={testId}
    >
      {children}
    </button>
  );
}
