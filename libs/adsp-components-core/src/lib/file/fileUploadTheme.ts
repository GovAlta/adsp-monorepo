export interface AdspFileUploadTheme {
  guidanceTextColor: string;
  statusTextColor: string;
  successTextColor: string;
  errorTextColor: string;
}

export const defaultFileUploadTheme: AdspFileUploadTheme = {
  guidanceTextColor: 'var(--adsp-color-text-secondary)',
  statusTextColor: 'var(--adsp-color-text-secondary)',
  successTextColor: 'var(--adsp-color-status-success)',
  errorTextColor: 'var(--adsp-color-status-emergency)',
};
