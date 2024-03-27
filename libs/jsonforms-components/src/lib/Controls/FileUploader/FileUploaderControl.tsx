import React, { useContext, useEffect } from 'react';
import { GoAFileUploadInput, GoAFormItem, GoACircularProgress, GoAModal } from '@abgov/react-components-new';
import { WithClassname, ControlProps } from '@jsonforms/core';

import styled from 'styled-components';
import { JsonFormContext } from '../../Context';

import { GoAContextMenu, GoAContextMenuIcon } from './ContextMenu';

type FileUploaderLayoutRendererProps = ControlProps & WithClassname;

export const FileUploader = ({ data, path, handleChange, uischema, ...props }: FileUploaderLayoutRendererProps) => {
  const enumerators = useContext(JsonFormContext);
  const uploadTriggerFunction = enumerators.functions.get('upload-file');
  const uploadTrigger = uploadTriggerFunction && uploadTriggerFunction();
  const downloadTriggerFunction = enumerators.functions.get('download-file');
  const downloadTrigger = downloadTriggerFunction && downloadTriggerFunction();
  const deleteTriggerFunction = enumerators.functions.get('delete-file');
  const deleteTrigger = deleteTriggerFunction && deleteTriggerFunction();
  const fileListValue = enumerators.data.get('file-list');
  // eslint-disable-next-line
  const fileList = fileListValue && (fileListValue() as Record<string, any>);
  const { required, label, i18nKeyPrefix } = props;

  const propertyId = i18nKeyPrefix as string;

  const variant = uischema?.options?.variant || 'button';

  function uploadFile(file: File) {
    if (uploadTrigger) {
      handleChange(propertyId, ['Loading', Array.isArray(data) ? data[1] : data, file?.name]);
      uploadTrigger(file, propertyId);
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

  useEffect(() => {
    // UseEffect is required because not having it causes a react update error, but
    // it doesn't function correctly within jsonforms unless there is a minor delay here
    const delayedFunction = () => {
      if (fileList && Array.isArray(data) && data[1] !== fileList[propertyId]?.urn) {
        handleChange(propertyId, fileList && fileList[propertyId]?.urn);
      }
    };

    const timeoutId = setTimeout(delayedFunction, 1);
    return () => clearTimeout(timeoutId);
  }, [data, handleChange, fileList, propertyId]);

  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

  return (
    <FileUploaderStyle id="file-upload" className="FileUploader">
      {required ? (
        <GoAFormItem label={label} requirement="required"></GoAFormItem>
      ) : (
        <div className="label">{props.label}</div>
      )}
      {!readOnly && (
        <div className="file-upload">
          <GoAFileUploadInput variant={variant} onSelectFile={uploadFile} />
        </div>
      )}
      <div>
        {Array.isArray(data) && data[0] === 'Loading' ? (
          <GoAModal open={Array.isArray(data) && data[0] === 'Loading'}>
            <div className="align-center">
              <GoACircularProgress visible={true} message={`Uploading ${data[2]}`} size="large" />
            </div>
          </GoAModal>
        ) : (
          <div>
            {fileList && fileList[props.i18nKeyPrefix as string] && (
              <AttachmentBorder>
                <div>{fileList && fileList[props.i18nKeyPrefix as string].filename}</div>
                <GoAContextMenu>
                  <GoAContextMenuIcon
                    testId="download-icon"
                    title="Download"
                    type="download"
                    onClick={() => downloadFile(fileList && fileList[props.i18nKeyPrefix as string])}
                  />
                  <GoAContextMenuIcon
                    data-testid="delete-icon"
                    title="Delete"
                    type="trash"
                    onClick={() => deleteFile(fileList && fileList[props.i18nKeyPrefix as string])}
                  />
                </GoAContextMenu>
              </AttachmentBorder>
            )}
          </div>
        )}
      </div>
    </FileUploaderStyle>
  );
};

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
