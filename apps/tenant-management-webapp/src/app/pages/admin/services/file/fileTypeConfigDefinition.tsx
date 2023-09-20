import React from 'react';
import { FileTypeItem } from '@store/file/models';
import { ConfigTombStoneWrapper } from './styled-components';

interface FileTypeConfigFormProps {
  fileType: FileTypeItem;
}

export const FileTypeConfigDefinition = ({ fileType }: FileTypeConfigFormProps) => {
  return (
    <ConfigTombStoneWrapper data-testid="task-config-form">
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td data-testid="queue-namespace" className="overflowContainer">
                {fileType.name}
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Type ID</th>
            </tr>
            <tr>
              <td data-testid="queue-name" className="overflowContainer">
                {fileType.id}
              </td>
            </tr>
          </thead>
        </table>
      </div>
    </ConfigTombStoneWrapper>
  );
};
