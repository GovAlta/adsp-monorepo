export type AdspButtonVariant = 'primary' | 'secondary';

export interface AdspButtonVariantTheme {
  background: string;
  borderColor: string;
  textColor: string;
  hoverBackground: string;
  hoverBorderColor: string;
  hoverTextColor: string;
}

export interface AdspButtonTheme {
  borderRadius: string;
  primary: AdspButtonVariantTheme;
  secondary: AdspButtonVariantTheme;
}

export const defaultButtonTheme: AdspButtonTheme = {
  borderRadius: 'var(--adsp-border-radius-m)',
  primary: {
    background: 'var(--adsp-color-interactive-default)',
    borderColor: 'var(--adsp-color-interactive-default)',
    textColor: 'var(--adsp-color-text-light)',
    hoverBackground: 'var(--adsp-color-interactive-hover)',
    hoverBorderColor: 'var(--adsp-color-interactive-hover)',
    hoverTextColor: 'var(--adsp-color-text-light)',
  },
  secondary: {
    background: 'transparent',
    borderColor: 'var(--adsp-color-interactive-default)',
    textColor: 'var(--adsp-color-interactive-default)',
    hoverBackground: 'transparent',
    hoverBorderColor: 'var(--adsp-color-interactive-hover)',
    hoverTextColor: 'var(--adsp-color-interactive-hover)',
  },
};
