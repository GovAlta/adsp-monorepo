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
  // eslint-disable-next-line
  latestFile: any;
  uploadTrigger?: (file: File) => void;
  downloadTrigger?: (file: File) => void;
}

export const FileUploader = ({ uploadTrigger, downloadTrigger, latestFile }: FileUploaderLayoutRendererProps) => {
  function uploadFile(file: File) {
    if (uploadTrigger) {
      uploadTrigger(file);
    }
  }
  function downloadFile(file: File) {
    if (downloadTrigger) {
      downloadTrigger(file);
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
