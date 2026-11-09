export interface AdspFileDownloadTheme {
  metadataTextColor: string;
  statusTextColor: string;
  errorTextColor: string;
}

export const defaultFileDownloadTheme: AdspFileDownloadTheme = {
  metadataTextColor: 'var(--adsp-color-text-secondary)',
  statusTextColor: 'var(--adsp-color-text-secondary)',
  errorTextColor: 'var(--adsp-color-status-emergency)',
};
