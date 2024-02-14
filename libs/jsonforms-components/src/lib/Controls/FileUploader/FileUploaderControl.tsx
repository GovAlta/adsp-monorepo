import React, { useContext, useEffect } from 'react';
import { GoAFileUploadInput, GoACircularProgress, GoAModal } from '@abgov/react-components-new';
import { WithClassname, ControlProps } from '@jsonforms/core';

import styled from 'styled-components';
import { JsonFormContextInstance } from '../../../index';

import { GoAContextMenu, GoAContextMenuIcon } from './ContextMenu';

type FileUploaderLayoutRendererProps = ControlProps & WithClassname;

export const FileUploader = ({ data, path, handleChange, uischema, ...props }: FileUploaderLayoutRendererProps) => {
  const enumerators = useContext(JsonFormContextInstance.jsonFormContext);
  const uploadTriggerFunction = enumerators.functions.get('upload-file');
  const uploadTrigger = uploadTriggerFunction && uploadTriggerFunction();
  const downloadTriggerFunction = enumerators.functions.get('download-file');
  const downloadTrigger = downloadTriggerFunction && downloadTriggerFunction();
  const deleteTriggerFunction = enumerators.functions.get('delete-file');
  const deleteTrigger = deleteTriggerFunction && deleteTriggerFunction();
  const lastFileValue = enumerators.data.get('file-list');
  const lastFile = lastFileValue && lastFileValue();

  const propertyId = props.i18nKeyPrefix as string;

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

  function handleChangeWrapper(propertyId: string, urn: string) {
    handleChange(propertyId, urn);
  }

  if (lastFile && Array.isArray(data) && data[1] !== lastFile[propertyId]?.urn) {
    handleChangeWrapper(propertyId, lastFile && lastFile[propertyId]?.urn);
  }

  return (
    <FileUploaderStyle id="file-upload" className="FileUploader">
      <div className="label">{props.label}</div>
      <div className="file-upload">
        <GoAFileUploadInput variant={variant} onSelectFile={uploadFile} />
      </div>
      <div>
        {Array.isArray(data) && data[0] === 'Loading' ? (
          <GoAModal open={Array.isArray(data) && data[0] === 'Loading'}>
            <div className="align-center">
              <GoACircularProgress visible={true} message={`Uploading ${data[2]}`} size="large" />
            </div>
          </GoAModal>
        ) : (
          <div>
            {lastFile && lastFile[props.i18nKeyPrefix as string] && (
              <AttachmentBorder>
                <div>{lastFile && lastFile[props.i18nKeyPrefix as string].filename}</div>
                <GoAContextMenu>
                  <GoAContextMenuIcon
                    testId="download-icon"
                    title="Download"
                    type="download"
                    onClick={() => downloadFile(lastFile && lastFile[props.i18nKeyPrefix as string])}
                  />
                  <GoAContextMenuIcon
                    data-testid="delete-icon"
                    title="Delete"
                    type="trash"
                    onClick={() => deleteFile(lastFile && lastFile[props.i18nKeyPrefix as string])}
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
  border: 1px solid #dcdcdc;
  border-radius: 0.25rem;
  padding: 0.5rem;
  width: fit-content;
  margin-top: 5px;
`;

const FileUploaderStyle = styled.div`
  .label {
    display: block;
    font-weight: var(--goa-font-weight-bold);
    color: var(--goa-color-text-default);
    font-size: var(--goa-font-size-4);
    padding: 0 0 0.5rem 0;
  }

  .align-center {
    text-align-last: center;
  }

  .file-upload {
    margin-bottom: 0.5rem;
  }
`;
