import React, { useContext } from 'react';
import { GoAFileUploadInput, GoAFormItem } from '@abgov/react-components-new';
import { WithClassname, ControlProps } from '@jsonforms/core';

import styled from 'styled-components';
import { JsonFormContextInstance } from '../../../index';

import { GoAContextMenu, GoAContextMenuIcon } from './ContextMenu';

type FileUploaderLayoutRendererProps = ControlProps & WithClassname;

export const FileUploader = ({ data, path, handleChange, ...props }: FileUploaderLayoutRendererProps) => {
  const enumerators = useContext(JsonFormContextInstance.jsonFormContext);
  const uploadTriggerFunction = enumerators.functions.get('upload-file');
  const uploadTrigger = uploadTriggerFunction && uploadTriggerFunction();
  const downloadTriggerFunction = enumerators.functions.get('download-file');
  const downloadTrigger = downloadTriggerFunction && downloadTriggerFunction();
  const lastFileValue = enumerators.data.get('file-list');
  const lastFile = lastFileValue && lastFileValue();
  const { required, label, i18nKeyPrefix } = props;

  const propertyId = i18nKeyPrefix as string;

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
    <>
      {required ? (
        <GoAFormItem label={label} requirement="required"></GoAFormItem>
      ) : (
        <GoAFormItem label={label}></GoAFormItem>
      )}

      <GoAFileUploadInput variant="button" onSelectFile={uploadFile} />
      {lastFile && lastFile[i18nKeyPrefix as string] && (
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
    </>
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
