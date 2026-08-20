import React, { useContext, useEffect, useState } from 'react';
import { GoabFileUploadInput, GoabFormItem, GoabCircularProgress, GoabModal } from '@abgov/react-components';
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

  const variant = uischema?.options?.variant || 'button';
  const noDownloadButton = uischema?.options?.format?.noDownloadButton;
  const noDownloadButtonInReview = uischema?.options?.format?.review?.noDownloadButton;
  const noDeleteButton = uischema?.options?.format?.review?.noDeleteButton;
  const [deleteHide, setDeleteHide] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const fileListLength = (fileList && fileList[path as string]?.length) || 0;

  const maxFiles = uischema?.options?.componentProps?.maximum ?? 1;

  const isMultiFile = maxFiles > 1;

  function uploadFile(file: File) {
    if (!uploadTrigger) return;

    const fileListLength = (fileList && fileList[propertyId]?.length) || 0;

    if (fileListLength >= maxFiles) {
      setUploadError(`You can only upload up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}.`);
      return;
    }

    setUploadError(undefined);
    setLoadingFileName(file?.name);
    uploadTrigger(file, path);
    setDeleteHide(false);
  }

  function downloadFile(file: File) {
    if (downloadTrigger) {
      downloadTrigger(file, propertyId);
    }
  }

  function deleteFile(file: File) {
    if (deleteTrigger) {
      deleteTrigger(file, propertyId);
    }
  }

  function getFileName(index: number) {
    return getFile(index)?.filename;
  }

  function getFile(index: number) {
    return fileList?.[path as string]?.[index];
  }

  type UploadedFile = {
    urn: string;
  };

  useEffect(() => {
    if (loadingFileName !== undefined) {
      setLoadingFileName(undefined);
    }

    const delayedFunction = () => {
      if (!fileList) return;

      const filesForControl: UploadedFile[] = fileList?.[path] || [];
      const hasFileListEntryForPath = Object.prototype.hasOwnProperty.call(fileList, path);

      const urns = filesForControl.map((f) => f.urn);
      if (urns.length === 0) {
        if (hasFileListEntryForPath && data !== undefined && data !== null && data !== '') {
          handleChange(path, undefined);
        }
      } else if (isMultiFile) {
        handleChange(path, urns);
      } else {
        handleChange(path, urns[0]);
      }
    };

    const timeoutId = setTimeout(delayedFunction, 1);
    return () => clearTimeout(timeoutId);
    //eslint-disable-next-line
  }, [data, fileList, path, propertyId, isMultiFile, handleChange, loadingFileName]);

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
                // adjust based on the actual shape of "detail"
                uploadFile(detail.file); // or detail.files[0], etc.
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
                ? (fileList[path as string] || []).map((_: unknown, i: number) => i)
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
