import React, { useContext, useState } from 'react';
import { GoAFileUploadInput } from '@abgov/react-components-new';
import { WithClassname, ControlProps } from '@jsonforms/core';

import styled from 'styled-components';
import { enumContext } from '../../../index';

import { GoAContextMenu, GoAContextMenuIcon } from './ContextMenu';

type FileUploaderLayoutRendererProps = ControlProps & WithClassname;

export const FileUploader = ({ data, path, handleChange, ...props }: FileUploaderLayoutRendererProps) => {
  const enumerators = useContext(enumContext);
  const uploadTriggerFunction = enumerators.functions.get('upload-file');
  const uploadTrigger = uploadTriggerFunction && uploadTriggerFunction();
  const downloadTriggerFunction = enumerators.functions.get('download-file');
  const downloadTrigger = downloadTriggerFunction && downloadTriggerFunction();
  const lastFileValue = enumerators.getters.get('last-file');
  const lastFile = lastFileValue && lastFileValue();

  const propertyId = props.i18nKeyPrefix as string;

  function uploadFile(file: File) {
    if (uploadTrigger) {
      handleChange(propertyId, 'lastFile?.urn');
      uploadTrigger(file, propertyId);
    }
  }
  function downloadFile(file: File) {
    if (downloadTrigger) {
      downloadTrigger(file, propertyId);
    }
  }

  if (lastFile && data !== lastFile[propertyId]?.urn) {
    handleChange(propertyId, lastFile && lastFile[propertyId]?.urn);
  }
  return (
    <FileUploaderStyle id="file-upload" className="FileUploader">
      <div className="label">{props.label}</div>
      <GoAFileUploadInput variant="button" onSelectFile={uploadFile} />
      {lastFile && lastFile[props.i18nKeyPrefix as string] && (
        <div>
          <AttachmentBorder>
            <div>{lastFile && lastFile[props.i18nKeyPrefix as string].filename}</div>

            <GoAContextMenu>
              <GoAContextMenuIcon
                testId="download-icon"
                title="Download"
                type="download"
                onClick={() => downloadFile(lastFile && lastFile[props.i18nKeyPrefix as string])}
              />
            </GoAContextMenu>
          </AttachmentBorder>
        </div>
      )}
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
    padding: 0.5rem 0;
  }
`;
