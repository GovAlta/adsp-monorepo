import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GoabFileUploadInput, GoabFormItem, GoabCircularProgress, GoabModal } from '@abgov/react-components-ds1';
import { WithClassname, ControlProps } from '@jsonforms/core';

import styled from 'styled-components';
import { JsonFormContext } from '../../Context';

import { GoAContextMenu, GoAContextMenuIcon } from './ContextMenu';
import { DeleteFileModal } from './DeleteFileModal';
import { Visible } from '../../util';
import { GoabFileUploadInputOnSelectFileDetail } from '@abgov/ui-components-common';
interface FileUploadAdditionalProps {
  isStepperReview?: boolean;
}

export type FileUploaderLayoutRendererProps = ControlProps & WithClassname & FileUploadAdditionalProps;

export const FileUploaderReview = (props: FileUploaderLayoutRendererProps) => {
  return FileUploader({ ...props, isStepperReview: true });
};

export const FileUploader = ({ data, path, handleChange, uischema, ...props }: FileUploaderLayoutRendererProps) => {
  const enumerators = useContext(JsonFormContext);

  type UploadedFile = {
    urn: string;
    filename?: string;
  };

  const uploadTriggerFunction = enumerators?.functions?.get('upload-file');
  const uploadTrigger = uploadTriggerFunction && uploadTriggerFunction();
  const downloadTriggerFunction = enumerators?.functions?.get('download-file');
  const downloadTrigger = downloadTriggerFunction && downloadTriggerFunction();
  const deleteTriggerFunction = enumerators?.functions?.get('delete-file');
  const deleteTrigger = deleteTriggerFunction && deleteTriggerFunction();
  const fileListValue = enumerators?.data.get('file-list');
  const [loadingFileName, setLoadingFileName] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  const countries = [
    'Argentina',
    'Brazil',
    'Canada',
    'Denmark',
    'Egypt',
    'France',
    'Greece',
    'India',
    'Japan',
    'Kenya',
  ];

  enumerators?.addFormContextData('countries', countries);
  const user = enumerators?.getFormContextData('user');

  // eslint-disable-next-line
  const fileList = fileListValue && (fileListValue() as Record<string, any>);

  const { required, label, i18nKeyPrefix, visible } = props;

  const propertyId = i18nKeyPrefix as string;
  const rootPath = typeof path === 'string' ? path.replace(/(\.\d+|\[\d+\])$/, '') : path;

  const variant = uischema?.options?.variant || 'button';
  const noDownloadButton = uischema?.options?.format?.noDownloadButton;
  const noDownloadButtonInReview = uischema?.options?.format?.review?.noDownloadButton;
  const noDeleteButton = uischema?.options?.format?.review?.noDeleteButton;
  const isArraySchema = props?.schema?.type === 'array' || Array.isArray(data);
  const maxFiles = uischema?.options?.componentProps?.maximum ?? (isArraySchema ? Number.MAX_SAFE_INTEGER : 1);
  const isMultiFile = maxFiles > 1 || isArraySchema;
  const metadataKey = path as string;
  const [deleteHide, setDeleteHide] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const pendingUploadIndexRef = useRef<number | null>(null);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const filesForDisplay: UploadedFile[] = useMemo(() => {
    if (!fileList) return [];

    if (isMultiFile) {
      const files =
        (fileList[metadataKey] as UploadedFile[]) ||
        (fileList[rootPath as string] as UploadedFile[]) ||
        (fileList[propertyId as string] as UploadedFile[]) ||
        [];

      const dataUrns = (Array.isArray(data) ? data : data ? [data] : []) as string[];
      if (dataUrns.length > 0) {
        const urnSet = new Set(dataUrns);
        const scopedFiles = files.filter((f) => urnSet.has(f.urn));
        if (scopedFiles.length > 0) {
          return scopedFiles.filter((file, index, all) => all.findIndex((f) => f.urn === file.urn) === index);
        }

        const allFiles = Object.values(fileList).flat() as UploadedFile[];
        const filesByUrn = dataUrns
          .map((urn) => allFiles.find((f) => f?.urn === urn))
          .filter((f): f is UploadedFile => !!f);
        if (filesByUrn.length > 0) {
          return filesByUrn.filter((file, index, all) => all.findIndex((f) => f.urn === file.urn) === index);
        }
      }

      // Keep a stable list even if upstream metadata briefly duplicates entries.
      return files.filter((file, index, all) => all.findIndex((f) => f.urn === file.urn) === index);
    }

    return (fileList[metadataKey] as UploadedFile[]) || (fileList[propertyId as string] as UploadedFile[]) || [];
  }, [fileList, isMultiFile, metadataKey, rootPath, propertyId, data]);
  const fileListLength = filesForDisplay.length;

  useEffect(() => {
    // Clear pending upload index when rendered file list catches up.
    pendingUploadIndexRef.current = null;
  }, [fileListLength, metadataKey, rootPath]);

  const getNextUploadIndex = (): number => {
    const baseIndex = filesForDisplay.length;
    if (pendingUploadIndexRef.current === null || pendingUploadIndexRef.current < baseIndex) {
      pendingUploadIndexRef.current = baseIndex;
    }

    const nextIndex = pendingUploadIndexRef.current;
    pendingUploadIndexRef.current += 1;
    return nextIndex;
  };

  async function uploadFile(file: File, requestedIndex?: number): Promise<void> {
    if (!uploadTrigger) return;

    const fileListLength = requestedIndex ?? (isMultiFile ? getNextUploadIndex() : filesForDisplay.length);

    // Single-file controls should allow selecting a new file to replace the current one.
    if (isMultiFile && fileListLength >= maxFiles) {
      setUploadError(`You can only upload up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}.`);
      return;
    }

    setUploadError(undefined);
    setLoadingFileName(file?.name);
    await Promise.resolve(uploadTrigger(file, isMultiFile ? `${rootPath}.${fileListLength}` : path));
    setDeleteHide(false);
  }

  function queueUpload(file: File, requestedIndex?: number): void {
    uploadQueueRef.current = uploadQueueRef.current
      .then(() => uploadFile(file, requestedIndex))
      .catch(() => {
        // Keep queue alive after an individual upload failure.
      });
  }

  function downloadFile(file?: UploadedFile) {
    if (downloadTrigger && file) {
      downloadTrigger(file, propertyId);
    }
  }

  function deleteFile(file?: UploadedFile) {
    if (deleteTrigger && file) {
      deleteTrigger(file, propertyId);
    }
  }

  function getFileName(index: number) {
    return getFile(index)?.filename;
  }

  function getFile(index: number) {
    return filesForDisplay?.[index];
  }

  useEffect(() => {
    if (loadingFileName !== undefined) {
      setLoadingFileName(undefined);
    }

    const delayedFunction = () => {
      if (!fileList) return;

      const filesForControl: UploadedFile[] = filesForDisplay || [];
      const hasFileListEntryForPath =
        Object.prototype.hasOwnProperty.call(fileList, metadataKey) ||
        Object.prototype.hasOwnProperty.call(fileList, rootPath) ||
        (!isMultiFile && Object.prototype.hasOwnProperty.call(fileList, propertyId));

      const urns = filesForControl.map((f) => f.urn);
      if (urns.length === 0) {
        if (hasFileListEntryForPath && data !== undefined && data !== null && data !== '') {
          handleChange(isMultiFile ? rootPath : path, undefined);
        }
      } else if (isMultiFile) {
        handleChange(rootPath, urns);
      } else {
        // Single-file replacement appends metadata; keep the latest selection as the current value.
        handleChange(path, urns[urns.length - 1]);
      }
    };

    const timeoutId = setTimeout(delayedFunction, 1);
    return () => clearTimeout(timeoutId);
  }, [
    data,
    fileList,
    filesForDisplay,
    rootPath,
    path,
    propertyId,
    metadataKey,
    isMultiFile,
    handleChange,
    loadingFileName,
  ]);

  const readOnly =
    uischema?.options?.componentProps?.readOnly === true || props?.isStepperReview === true || user === null;
  const maxFileSize = uischema?.options?.componentProps?.maxFileSize ?? '';
  const accept = uischema?.options?.componentProps?.accept ?? '';
  if (!enumerators) {
    //eslint-disable-next-line
    return <></>;
  }
  const helpText = uischema?.options?.help;
  const sentenceCaseLabel = label;

  const renderFileItem = (index: number): JSX.Element => {
    const showFileDeleteConfirmation = deleteConfirmIndex === index;
    return (
      <div>
        {readOnly ? (
          <AttachmentBorderDisabled>
            {getFileName(index)}
            {noDownloadButtonInReview !== true && (
              <GoAContextMenuIcon
                testId="download-icon"
                title="Download"
                type="download"
                onClick={() => downloadFile(getFile(index))}
              />
            )}
          </AttachmentBorderDisabled>
        ) : (
          <AttachmentBorder>
            <div>{getFileName(index)}</div>
            <GoAContextMenu>
              {noDownloadButton !== true && (
                <GoAContextMenuIcon
                  testId="download-icon"
                  title="Download"
                  type="download"
                  onClick={() => downloadFile(getFile(index))}
                />
              )}

              {noDeleteButton !== true && (
                <GoAContextMenuIcon
                  data-testid="delete-icon"
                  title="Delete"
                  type="trash"
                  onClick={() => {
                    setDeleteConfirmIndex(index);
                  }}
                />
              )}
            </GoAContextMenu>
            <DeleteFileModal
              isOpen={showFileDeleteConfirmation}
              title="Delete file"
              content={`Delete file ${getFile(index)?.filename} ?`}
              onCancel={() => setDeleteConfirmIndex(null)}
              onDelete={() => {
                setDeleteConfirmIndex(null);
                deleteFile(getFile(index));
                if (!isMultiFile) {
                  setDeleteHide(true);
                }
                setUploadError(undefined);
              }}
            />
          </AttachmentBorder>
        )}
      </div>
    );
  };

  return (
    <Visible $visible={visible}>
      <FileUploaderStyle className="FileUploader">
        <GoabFormItem label={sentenceCaseLabel} requirement={required ? 'required' : undefined} error={uploadError} />
        {!readOnly && (
          <div className="file-upload">
            <GoabFileUploadInput
              variant={variant}
              onSelectFile={(detail: GoabFileUploadInputOnSelectFileDetail) => {
                const selectedFiles = (detail as unknown as { files?: File[] })?.files?.length
                  ? ((detail as unknown as { files?: File[] }).files as File[])
                  : detail?.file
                    ? [detail.file]
                    : [];

                if (selectedFiles.length === 0) {
                  return;
                }

                if (isMultiFile) {
                  for (const selectedFile of selectedFiles) {
                    const nextIndex = getNextUploadIndex();
                    if (nextIndex >= maxFiles) {
                      setUploadError(`You can only upload up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}.`);
                      break;
                    }
                    queueUpload(selectedFile, nextIndex);
                  }
                } else {
                  queueUpload(selectedFiles[0]);
                }
              }}
              maxFileSize={maxFileSize}
              accept={accept}
            />
          </div>
        )}
        {helpText && <HelpText>{helpText}</HelpText>}
        <div>
          {loadingFileName !== undefined ? (
            <GoabModal open={loadingFileName !== undefined}>
              <div className="align-center">
                <GoabCircularProgress visible={true} message={`Uploading ${loadingFileName}`} size="large" />
              </div>
            </GoabModal>
          ) : (
            <div>
              {(fileList && isMultiFile
                ? filesForDisplay.map((_: unknown, i: number) => i)
                : !deleteHide && getFile(fileListLength - 1) && fileListLength >= 0
                  ? [fileListLength - 1]
                  : []
              ).map((index: number) => (
                <React.Fragment key={index}>{renderFileItem(index)}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      </FileUploaderStyle>
    </Visible>
  );
};

const HelpText = styled.div`
  margin-top: var(--goa-space-xs);
  font-size: var(--goa-font-size-3);
  color: var(--goa-color-text-secondary);
`;

const AttachmentBorderDisabled = styled.div`
  display: flex;
  flex-direction: row;
  border: var(--goa-border-width-s) solid #dcdcdc;
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-space-xs);
  width: fit-content;
  background-color: #f1f1f1;
`;
const AttachmentBorder = styled.div`
  display: flex;
  flex-direction: row;
  border: var(--goa-border-width-s) solid #dcdcdc;
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-space-xs);
  width: fit-content;
  margin-top: var(--goa-space-2xs);
`;

const FileUploaderStyle = styled.div`
  margin-bottom: var(--goa-space-l);
  .label {
    display: block;
    font-weight: var(--goa-font-weight-bold);
    color: var(--goa-color-text-default);
    font-size: var(--goa-font-size-4);
    padding: 0 0 var(--goa-space-xs) 0;
  }

  .align-center {
    text-align-last: center;
  }

  .file-upload {
    margin-bottom: var(--goa-space-xs);
  }
`;
