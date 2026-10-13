export interface AdspCardTheme {
  background: string;
  borderColor: string;
  borderRadius: string;
  padding: string;
  headingColor: string;
}

export const defaultCardTheme: AdspCardTheme = {
  background: 'var(--adsp-color-surface-card)',
  borderColor: 'var(--adsp-color-border-default)',
  borderRadius: 'var(--adsp-border-radius-m)',
  padding: 'var(--adsp-spacing-l)',
  headingColor: 'var(--adsp-color-text-default)',
};
