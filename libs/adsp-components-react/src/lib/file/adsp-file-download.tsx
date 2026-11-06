import { cloneElement, isValidElement } from 'react';
import { GoabButton } from '@abgov/react-components';
import { formatFileSize, getFileErrorMessage } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';
import { useAdspFileClient } from './adsp-file-client-provider';
import { useFileDownload } from './useFileDownload';
import type { AdspFileDownloadProps, AdspFileDownloadTriggerProps } from './types';

export const AdspFileDownload = ({
  fileId,
  client,
  canDownload = true,
  children,
  themeOverrides,
  testId,
}: AdspFileDownloadProps) => {
  const themeStyle = useAdspThemeStyle('fileDownload', themeOverrides);
  const contextClient = useAdspFileClient();
  const resolvedClient = client ?? contextClient;
  const trigger = isValidElement<AdspFileDownloadTriggerProps>(children) ? children : null;

  const { file, loading, downloading, ready, error, download, retry } = useFileDownload(
    canDownload ? resolvedClient : undefined,
    fileId,
    { loadMetadata: !trigger },
  );

  if (!resolvedClient) {
    throw new Error(
      'AdspFileDownload needs a file client: pass the client prop or render it inside an AdspFileClientProvider.',
    );
  }

  if (!canDownload) {
    return null;
  }

  const renderTrigger = () => {
    if (!trigger) {
      return null;
    }

    const { onClick, disabled } = trigger.props;
    return cloneElement(trigger, {
      onClick: (event?: { preventDefault?: () => void }) => {
        // A link trigger would otherwise navigate as well as download.
        event?.preventDefault?.();
        onClick?.(event);
        void download();
      },
      disabled: disabled || downloading,
    });
  };

  const renderDefaultControl = () => {
    if (loading) {
      return (
        <span className="adsp-file-download__status" role="status">
          Loading file details...
        </span>
      );
    }

    if (!file) {
      return null;
    }

    return (
      <>
        <GoabButton
          type="tertiary"
          leadingIcon="download"
          disabled={!ready || downloading}
          onClick={() => void download()}
          testId={testId ? `${testId}-button` : undefined}
        >
          {file.filename}
        </GoabButton>
        <span className="adsp-file-download__metadata">{formatFileSize(file.size)}</span>
      </>
    );
  };

  return (
    <div className="adsp-file-download" style={themeStyle} data-testid={testId} aria-busy={loading || downloading}>
      {trigger ? renderTrigger() : renderDefaultControl()}
      {downloading && (
        <span className="adsp-file-download__status" role="status">
          Downloading...
        </span>
      )}
      {error && (
        <p className="adsp-file-download__error" role="alert">
          <span>{getFileErrorMessage(error.reason)}</span>
          {error.retryable && (
            <GoabButton type="tertiary" size="compact" onClick={retry} testId={testId ? `${testId}-retry` : undefined}>
              Try again
            </GoabButton>
          )}
        </p>
      )}
    </div>
  );
};

// The name the File Service Components design uses.
export type GoAFileDownloadProps = AdspFileDownloadProps;
export const GoAFileDownload = AdspFileDownload;
