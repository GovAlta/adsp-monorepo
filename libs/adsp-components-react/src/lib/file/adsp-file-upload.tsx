import { useEffect, useRef, useState } from 'react';
import { GoabButton, GoabFileUploadCard, GoabFileUploadInput } from '@abgov/react-components';
import { getFileUploadErrorMessage } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';
import { useFileUpload } from './useFileUpload';
import type { ADSPFileUploadProps } from './types';

// File service accepts files up to 3 GB (see createUpload in apps/file-service/src/file/router/upload.ts);
// without this the GoA input would reject anything over its 5 MB default.
export const FILE_SERVICE_MAX_FILE_SIZE = '3GB';

// GoA elements keep their native control in a shadow root that doesn't delegate focus, so focus that control instead.
function tryFocus(element: HTMLElement | null | undefined): boolean {
  if (!element) {
    return false;
  }

  (element.shadowRoot?.querySelector<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])') ?? element).focus();
  const active = element.ownerDocument.activeElement;
  return active === element || element.contains(active);
}

export const ADSPFileUpload = ({
  fileTypeId,
  client,
  canUpload = true,
  recordId,
  onUpload,
  themeOverrides,
  testId,
}: ADSPFileUploadProps) => {
  const themeStyle = useAdspThemeStyle('fileUpload', themeOverrides);
  // Without permission, the hook gets no client, so nothing is requested.
  const { fileType, loading, status, selectedFile, progress, uploaded, error, ready, upload, retry, reset } =
    useFileUpload(canUpload ? client : undefined, fileTypeId, { recordId, onUpload });
  const rootRef = useRef<HTMLDivElement>(null);
  const [restoreFocus, setRestoreFocus] = useState(false);

  // Cancel, remove and Try again take away the control that had focus. Once the state settles, move focus to what
  // the user needs next: the error after a failure, otherwise the drop area, otherwise the component itself.
  useEffect(() => {
    if (!restoreFocus || loading || status === 'uploading') {
      return;
    }

    setRestoreFocus(false);
    const root = rootRef.current;
    if (error) {
      tryFocus(root?.querySelector<HTMLElement>('.adsp-file-upload__error')) || tryFocus(root);
    } else {
      tryFocus(root?.querySelector<HTMLElement>('goa-file-upload-input')) || tryFocus(root);
    }
  }, [restoreFocus, loading, status, error]);

  if (!canUpload) {
    return null;
  }

  const childTestId = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined);
  const withFocusRestore = (action: () => void) => () => {
    setRestoreFocus(true);
    action();
  };
  const uploading = status === 'uploading';

  // No aria-busy here: it would hold back the role=status announcements inside until the work is done.
  return (
    <div className="adsp-file-upload" style={themeStyle} data-testid={testId} ref={rootRef} tabIndex={-1}>
      {loading && (
        <p className="adsp-file-upload__status" role="status">
          Loading upload details...
        </p>
      )}

      {/* One upload at a time: the drop area comes back once the current upload has finished. */}
      {fileType && !uploading && (
        <GoabFileUploadInput
          variant="dragdrop"
          maxFileSize={FILE_SERVICE_MAX_FILE_SIZE}
          onSelectFile={({ file }) => {
            if (ready) {
              void upload(file);
            }
          }}
          testId={childTestId('input')}
        />
      )}

      {selectedFile && (
        <GoabFileUploadCard
          filename={selectedFile.name}
          size={selectedFile.size}
          type={selectedFile.type || undefined}
          progress={uploading ? Math.round(progress * 100) : -1}
          error={status === 'failed' && error ? getFileUploadErrorMessage(error.reason) : undefined}
          onCancel={withFocusRestore(reset)}
          onDelete={withFocusRestore(reset)}
          testId={childTestId('card')}
        />
      )}

      {uploading && selectedFile && (
        <p className="adsp-file-upload__status" role="status">
          Uploading {selectedFile.name}...
        </p>
      )}
      {status === 'uploaded' && uploaded && (
        <p className="adsp-file-upload__success" role="status">
          {uploaded.filename} uploaded.
        </p>
      )}
      {error && (
        <p className="adsp-file-upload__error" role="alert" tabIndex={-1}>
          <span>{getFileUploadErrorMessage(error.reason)}</span>
          {error.retryable && (
            <GoabButton type="tertiary" size="compact" onClick={withFocusRestore(retry)} testId={childTestId('retry')}>
              Try again
            </GoabButton>
          )}
        </p>
      )}
    </div>
  );
};
