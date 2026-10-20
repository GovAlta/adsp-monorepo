export interface AdspConversationTheme {
  background: string;
  borderColor: string;
  sentBackground: string;
  sentBorderColor: string;
  sentTextColor: string;
  receivedBackground: string;
  receivedBorderColor: string;
  receivedTextColor: string;
  metadataTextColor: string;
  composerBackground: string;
  composerBorderColor: string;
  composerTextColor: string;
  actionTextColor: string;
  stateTextColor: string;
}

export const defaultConversationTheme: AdspConversationTheme = {
  background: 'var(--adsp-color-surface-page)',
  borderColor: 'var(--adsp-color-border-default)',
  sentBackground: 'var(--adsp-color-interactive-default)',
  sentBorderColor: 'var(--adsp-color-interactive-default)',
  sentTextColor: 'var(--adsp-color-text-light)',
  receivedBackground: 'var(--adsp-color-surface-default)',
  receivedBorderColor: 'var(--adsp-color-border-default)',
  receivedTextColor: 'var(--adsp-color-text-default)',
  metadataTextColor: 'var(--adsp-color-text-secondary)',
  composerBackground: 'var(--adsp-color-surface-input)',
  composerBorderColor: 'var(--adsp-color-border-default)',
  composerTextColor: 'var(--adsp-color-text-default)',
  actionTextColor: 'var(--adsp-color-interactive-default)',
  stateTextColor: 'var(--adsp-color-text-secondary)',
};