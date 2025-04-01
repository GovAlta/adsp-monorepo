import React, { useContext, useEffect, useState } from 'react';
import { GoAFileUploadInput, GoAFormItem, GoACircularProgress, GoAModal } from '@abgov/react-components';
import { WithClassname, ControlProps } from '@jsonforms/core';

import styled from 'styled-components';
import { JsonFormContext } from '../../Context';

import { GoAContextMenu, GoAContextMenuIcon } from './ContextMenu';
import { DeleteFileModal } from './DeleteFileModal';
import { convertToSentenceCase } from '../../util';

interface FileUploadAdditionalProps {
  isStepperReview?: boolean;
}

export type FileUploaderLayoutRendererProps = ControlProps & WithClassname & FileUploadAdditionalProps;

const DELAY_UPLOAD_TIMEOUT_MS = 5;
const DELAY_DELETE_TIMEOUT_MS = 5;

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

  const { required, label, i18nKeyPrefix } = props;

  const propertyId = i18nKeyPrefix as string;

  const variant = uischema?.options?.variant || 'button';
  const multiFileUploader = variant === 'dragdrop';

  const [deleteHide, setDeleteHide] = useState(false);

  function uploadFile(file: File) {
    if (uploadTrigger) {
      uploadTrigger(file, propertyId);
      const handleFunction = () => {
        const value = ['Loading', Array.isArray(data) ? data[1] : file?.name];
        handleChange(propertyId, value);
      };
      setDeleteHide(false);
      setTimeout(handleFunction, DELAY_UPLOAD_TIMEOUT_MS);
    }
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
    return (
      fileList && fileList[props.i18nKeyPrefix as string] && fileList[props.i18nKeyPrefix as string][index]?.filename
    );
  }

  function getFile(index: number) {
    return fileList && fileList[props.i18nKeyPrefix as string] && fileList[props.i18nKeyPrefix as string][index];
  }

  useEffect(() => {
    // UseEffect is required because not having it causes a react update error, but
    // it doesn't function correctly within jsonforms unless there is a minor delay here
    const delayedFunction = () => {
      if (fileList) {
        handleChange(propertyId, fileList && fileList[propertyId]?.urn);
      }
    };

    const timeoutId = setTimeout(delayedFunction, 1);
    return () => clearTimeout(timeoutId);
  }, [handleChange, fileList, propertyId]);

  const readOnly =
    uischema?.options?.componentProps?.readOnly === true || props?.isStepperReview === true || user === null;
  const maxFileSize = uischema?.options?.componentProps?.maxFileSize ?? '';
  const accept = uischema?.options?.componentProps?.accept ?? '';
  if (!enumerators) {
    return <></>;
  }
  const helpText = uischema?.options?.help;
  const sentenceCaseLabel = convertToSentenceCase(label);

  const DownloadFileWidget = ({ index }: { index: number }): JSX.Element => {
    const [showFileDeleteConfirmation, setShowFileDeleteConfirmation] = useState(false);
    return (
      <div>
        {readOnly && index ? (
          <AttachmentBorderDisabled>
            {getFileName(index)}
            <GoAContextMenuIcon
              testId="download-icon"
              title="Download"
              type="download"
              onClick={() => downloadFile(getFile(index))}
            />
          </AttachmentBorderDisabled>
        ) : (
          <AttachmentBorder>
            <div>{getFileName(index)}</div>
            <GoAContextMenu>
              <GoAContextMenuIcon
                testId="download-icon"
                title="Download"
                type="download"
                onClick={() => downloadFile(getFile(index))}
              />
              <GoAContextMenuIcon
                data-testid="delete-icon"
                title="Delete"
                type="trash"
                onClick={() => {
                  setShowFileDeleteConfirmation(true);
                }}
              />
            </GoAContextMenu>
            <DeleteFileModal
              isOpen={showFileDeleteConfirmation}
              title="Delete file"
              content={`Delete file ${getFile(index)?.filename} ?`}
              onCancel={() => setShowFileDeleteConfirmation(false)}
              onDelete={() => {
                setShowFileDeleteConfirmation(false);
                deleteFile(getFile(index));
                setDeleteHide(true);
                const handleFunction = () => {
                  handleChange(propertyId, '');
                };
                setTimeout(handleFunction, DELAY_DELETE_TIMEOUT_MS);
              }}
            />
          </AttachmentBorder>
        )}
      </div>
    );
  };

  const fileListLength = (fileList && fileList[props.i18nKeyPrefix as string]?.length) || 0;

  return (
    <FileUploaderStyle className="FileUploader">
      {required ? (
        <GoAFormItem label={sentenceCaseLabel} requirement="required"></GoAFormItem>
      ) : (
        <div className="label">{sentenceCaseLabel}</div>
      )}
      {!readOnly && (
        <div className="file-upload">
          <GoAFileUploadInput variant={variant} onSelectFile={uploadFile} maxFileSize={maxFileSize} accept={accept} />
        </div>
      )}
      {helpText && <HelpText>{helpText}</HelpText>}
      <div>
        {Array.isArray(data) && data[0] === 'Loading' ? (
          <GoAModal open={Array.isArray(data) && data[0] === 'Loading'}>
            <div className="align-center">
              <GoACircularProgress visible={true} message={`Uploading ${data[1]}`} size="large" />
            </div>
          </GoAModal>
        ) : (
          <div>
            {multiFileUploader
              ? fileList &&
                (fileList[props.i18nKeyPrefix as string] || []).map((_: File, index: number) => {
                  return <DownloadFileWidget index={index} />;
                })
              : fileList &&
                !deleteHide &&
                getFile(fileListLength - 1) &&
                fileListLength >= 0 && <DownloadFileWidget index={fileListLength - 1} />}
          </div>
        )}
      </div>
    </FileUploaderStyle>
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
