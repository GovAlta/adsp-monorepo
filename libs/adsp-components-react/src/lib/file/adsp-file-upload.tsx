import { useEffect, useRef, useState } from 'react';
import { GoabButton, GoabFileUploadCard, GoabFileUploadInput } from '@abgov/react-components';
import { formatAllowedFileTypes, getFileUploadErrorMessage } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';
import { useFileUpload, type FileUploadItem } from './useFileUpload';
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

type SelectFileDetail = Parameters<Parameters<typeof GoabFileUploadInput>[0]['onSelectFile']>[0];

// Newer GoA versions report every file dropped or picked at once; older ones report a single file.
function getSelectedFiles(detail: SelectFileDetail): File[] {
  const files = (detail as SelectFileDetail & { files?: File[] }).files;
  if (files?.length) {
    return [...files];
  }
  return detail?.file ? [detail.file] : [];
}

// The card reads 100% as done, but File service only answers once it has received and checked the whole file.
function toCardProgress(item: FileUploadItem): number {
  return item.status === 'uploading' ? Math.min(99, Math.round(item.progress * 100)) : -1;
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
  const { fileType, loading, typeError, ready, uploads, upload, retry, remove, reloadType } = useFileUpload(
    canUpload ? client : undefined,
    fileTypeId,
    { recordId, onUpload },
  );
  const rootRef = useRef<HTMLDivElement>(null);
  // The upload whose control was used (true for the File Type reload); focus moves once that one has settled.
  const [restoreFocus, setRestoreFocus] = useState<string | boolean>(false);

  // Cancel, dismiss and Try again take away the control that had focus. Once the state settles, move focus to the
  // first error, otherwise the drop area, otherwise the component itself.
  useEffect(() => {
    const pending =
      typeof restoreFocus === 'string' &&
      uploads.some((item) => item.id === restoreFocus && item.status === 'uploading');
    if (!restoreFocus || loading || pending) {
      return;
    }

    setRestoreFocus(false);
    const root = rootRef.current;
    tryFocus(root?.querySelector<HTMLElement>('.adsp-file-upload__error')) ||
      tryFocus(root?.querySelector<HTMLElement>('goa-file-upload-input')) ||
      tryFocus(root);
  }, [restoreFocus, loading, uploads]);

  if (!canUpload) {
    return null;
  }

  const childTestId = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined);
  const withFocusRestore =
    (action: () => void, id: string | boolean = true) =>
    () => {
      setRestoreFocus(id);
      action();
    };
  const allowedFileTypes = fileType?.allowedFileTypes ?? [];

  // No aria-busy here: it would hold back the role=status announcements inside until the work is done.
  return (
    <div className="adsp-file-upload" style={themeStyle} data-testid={testId} ref={rootRef} tabIndex={-1}>
      {loading && (
        <p className="adsp-file-upload__status" role="status">
          Loading upload details...
        </p>
      )}

      {typeError && (
        <p className="adsp-file-upload__error" role="alert" tabIndex={-1}>
          <span>{getFileUploadErrorMessage(typeError.reason)}</span>
          {typeError.retryable && (
            <GoabButton
              type="tertiary"
              size="compact"
              onClick={withFocusRestore(reloadType)}
              testId={childTestId('retry')}
            >
              Try again
            </GoabButton>
          )}
        </p>
      )}

      {fileType && (
        <>
          <GoabFileUploadInput
            variant="dragdrop"
            maxFileSize={FILE_SERVICE_MAX_FILE_SIZE}
            onSelectFile={(detail) => {
              if (ready) {
                upload(getSelectedFiles(detail));
              }
            }}
            testId={childTestId('input')}
          />
          {allowedFileTypes.length > 0 && (
            <p className="adsp-file-upload__guidance" data-testid={childTestId('guidance')}>
              Allowed formats: {formatAllowedFileTypes(allowedFileTypes)}
            </p>
          )}
        </>
      )}

      {uploads.length > 0 && (
        <ul className="adsp-file-upload__list" data-testid={childTestId('list')}>
          {uploads.map((item, index) => (
            <li key={item.id} className="adsp-file-upload__item">
              {item.status === 'uploaded' && item.uploaded ? (
                // Once uploaded there is nothing to cancel, and dismissing it wouldn't remove it from File service,
                // so the card and its Remove button give way to a confirmation.
                <p className="adsp-file-upload__success" role="status" data-testid={childTestId(`uploaded-${index}`)}>
                  {item.uploaded.filename} uploaded.
                </p>
              ) : (
                <>
                  <GoabFileUploadCard
                    filename={item.file.name}
                    size={item.file.size}
                    type={item.file.type || undefined}
                    progress={toCardProgress(item)}
                    error={
                      item.status === 'failed' && item.error ? getFileUploadErrorMessage(item.error.reason) : undefined
                    }
                    onCancel={withFocusRestore(() => remove(item.id), item.id)}
                    // A card in its error state offers Cancel but reports it as a delete.
                    onDelete={withFocusRestore(() => remove(item.id), item.id)}
                    testId={childTestId(`card-${index}`)}
                  />
                  {item.status === 'uploading' && (
                    <p className="adsp-file-upload__status" role="status">
                      Uploading {item.file.name}...
                    </p>
                  )}
                  {item.status === 'failed' && item.error && (
                    <p className="adsp-file-upload__error" role="alert" tabIndex={-1}>
                      <span>
                        {item.file.name}: {getFileUploadErrorMessage(item.error.reason)}
                        {item.error.reason === 'unsupported-format' && allowedFileTypes.length > 0
                          ? ` Allowed formats: ${formatAllowedFileTypes(allowedFileTypes)}.`
                          : ''}
                      </span>
                      {item.error.retryable && (
                        <GoabButton
                          type="tertiary"
                          size="compact"
                          onClick={withFocusRestore(() => retry(item.id), item.id)}
                          testId={childTestId(`retry-${index}`)}
                        >
                          Try again
                        </GoabButton>
                      )}
                    </p>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
