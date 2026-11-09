import { GoabButton, GoabFileUploadCard, GoabFileUploadInput } from '@abgov/react-components';
import { getFileUploadErrorMessage } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';
import { useFileUpload } from './useFileUpload';
import type { ADSPFileUploadProps } from './types';

// File service accepts files up to 3 GB (see createUpload in apps/file-service/src/file/router/upload.ts);
// without this the GoA input would reject anything over its 5 MB default.
export const FILE_SERVICE_MAX_FILE_SIZE = '3GB';

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

  if (!canUpload) {
    return null;
  }

  const childTestId = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined);
  const uploading = status === 'uploading';

  // No aria-busy here: it would hold back the role=status announcements inside until the work is done.
  return (
    <div className="adsp-file-upload" style={themeStyle} data-testid={testId}>
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
          onCancel={reset}
          onDelete={reset}
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
        <p className="adsp-file-upload__error" role="alert">
          <span>{getFileUploadErrorMessage(error.reason)}</span>
          {error.retryable && (
            <GoabButton type="tertiary" size="compact" onClick={retry} testId={childTestId('retry')}>
              Try again
            </GoabButton>
          )}
        </p>
      )}
    </div>
  );
};
