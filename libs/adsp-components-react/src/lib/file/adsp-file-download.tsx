import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { GoabButton } from '@abgov/react-components';
import { formatFileSize, getFileErrorMessage } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';
import { useFileDownload } from './useFileDownload';
import type { ADSPFileDownloadProps, ADSPFileDownloadTriggerProps } from './types';

const FOCUSABLE = 'goa-button, button, a[href], [tabindex]:not([tabindex="-1"])';

// GoA buttons keep their native button in a shadow root that doesn't delegate focus, so focus that button instead.
function tryFocus(element: HTMLElement | null | undefined): boolean {
  if (!element) {
    return false;
  }

  (element.shadowRoot?.querySelector<HTMLElement>('button, a[href]') ?? element).focus();
  const active = element.ownerDocument.activeElement;
  return active === element || element.contains(active);
}

export const ADSPFileDownload = ({
  fileId,
  client,
  canDownload = true,
  children,
  themeOverrides,
  testId,
}: ADSPFileDownloadProps) => {
  const themeStyle = useAdspThemeStyle('fileDownload', themeOverrides);
  const trigger = isValidElement<ADSPFileDownloadTriggerProps>(children) ? children : null;
  const rootRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [restoreFocus, setRestoreFocus] = useState(false);

  // Without permission, the hook gets no client, so nothing is requested.
  const { file, loading, downloading, ready, error, download, retry } = useFileDownload(
    canDownload ? client : undefined,
    fileId,
    { loadMetadata: !trigger },
  );

  const busy = loading || downloading;

  // Try again removes itself, so once the retry settles, put focus back on what the user needs next:
  // the control after a success, or the error after another failure.
  useEffect(() => {
    if (!restoreFocus || busy) {
      return;
    }

    setRestoreFocus(false);
    const root = rootRef.current;
    if (error) {
      tryFocus(errorRef.current?.querySelector<HTMLElement>(FOCUSABLE)) || tryFocus(errorRef.current);
    } else {
      const control = Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).find(
        (element) => !errorRef.current?.contains(element),
      );
      tryFocus(control) || tryFocus(root);
    }
  }, [restoreFocus, busy, error]);

  if (!canDownload) {
    return null;
  }

  const handleRetry = () => {
    setRestoreFocus(true);
    retry();
  };

  const renderTrigger = () => {
    if (!trigger) {
      return null;
    }

    const { onClick, disabled } = trigger.props;
    const inactive = !!disabled || downloading;
    // A link can't be disabled, so mark it aria-disabled and ignore its clicks instead.
    const isLink = trigger.type === 'a';

    return cloneElement(trigger, {
      onClick: (event?: { preventDefault?: () => void }) => {
        // A link trigger would otherwise navigate as well as download.
        event?.preventDefault?.();
        if (inactive) {
          return;
        }
        onClick?.(event);
        void download();
      },
      ...(isLink ? { 'aria-disabled': inactive || undefined } : { disabled: inactive }),
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

  // No aria-busy here: it would hold back the role=status announcements inside until the work is done.
  return (
    <div className="adsp-file-download" style={themeStyle} data-testid={testId} ref={rootRef} tabIndex={-1}>
      {trigger ? renderTrigger() : renderDefaultControl()}
      {downloading && (
        <span className="adsp-file-download__status" role="status">
          Downloading...
        </span>
      )}
      {error && (
        <p className="adsp-file-download__error" role="alert" ref={errorRef} tabIndex={-1}>
          <span>{getFileErrorMessage(error.reason)}</span>
          {error.retryable && (
            <GoabButton
              type="tertiary"
              size="compact"
              onClick={handleRetry}
              testId={testId ? `${testId}-retry` : undefined}
            >
              Try again
            </GoabButton>
          )}
        </p>
      )}
    </div>
  );
};
