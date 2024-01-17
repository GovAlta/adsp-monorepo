import React from 'react';
import { GoAFileUploadInput } from '@abgov/react-components-new';
import { Categorization, Category, StatePropsOfLayout } from '@jsonforms/core';

import { TranslateProps } from '@jsonforms/react';
import { AjvProps } from '@jsonforms/material-renderers';
import styled from 'styled-components';

import { GoAContextMenu, GoAContextMenuIcon } from './ContextMenu';

export interface GoAFileUploaderSchemaProps extends Omit<Categorization, 'elements'> {
  elements: (Category | Categorization)[];
}

export interface FileUploaderLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  // eslint-disable-next-line
  data: any;
  token: string;
  uploadPath: string;
  uploadTrigger?: (file: File) => void;
  downloadTrigger?: (file: File) => void;
  latestFile: any;
}

export const FileUploader = ({
  uischema,
  data,
  schema,
  // eslint-disable-next-line
  ajv,
  path,
  cells,
  renderers,
  config,
  token,
  uploadPath,
  uploadTrigger,
  downloadTrigger,
  latestFile,
}: FileUploaderLayoutRendererProps) => {
  const uiSchema = uischema as unknown as GoAFileUploaderSchemaProps;

  function uploadFile(file: File) {
    if (uploadTrigger) {
      uploadTrigger(file);
    } else {
      console.log('Upload trigger is not defined');
      console.log('pretending to upload file');
    }
  }
  function downloadFile(file: File) {
    if (downloadTrigger) {
      downloadTrigger(file);
    } else {
      console.log('Download trigger is not defined');
      console.log('pretending to download file');
    }
  }

  return (
    <div id="file-upload" className="FileUploader">
      <GoAFileUploadInput variant="button" onSelectFile={uploadFile} />
      {latestFile && (
        <div>
          <AttachmentBorder>
            <div>{latestFile.filename}</div>

            <GoAContextMenu>
              <GoAContextMenuIcon
                testId="download-icon"
                title="Download"
                type="download"
                onClick={() => downloadFile(latestFile)}
              />
            </GoAContextMenu>
          </AttachmentBorder>
        </div>
      )}
    </div>
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
