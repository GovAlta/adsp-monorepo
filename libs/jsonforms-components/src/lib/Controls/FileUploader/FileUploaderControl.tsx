import React, { useContext, useEffect } from 'react';
import { GoAFileUploadInput } from '@abgov/react-components-new';
import { Categorization, Category, StatePropsOfLayout, CellProps, WithClassname, ControlProps } from '@jsonforms/core';

import { JsonFormsReduxContextProps, TranslateProps } from '@jsonforms/react';
import { AjvProps } from '@jsonforms/material-renderers';
import styled from 'styled-components';
import { enumContext } from '../../../index';

import { GoAContextMenu, GoAContextMenuIcon } from './ContextMenu';

// export interface GoAFileUploaderSchemaProps extends Omit<Categorization, 'elements'> {
//   elements: (Category | Categorization)[];
// }

// export interface FileUploaderLayoutRendererProps extends CellProps {
//   // eslint-disable-next-line
//   data: any;
//   // eslint-disable-next-line
//   latestFile: any;
//   // uploadTrigger?: (file: File) => void;
//   // downloadTrigger?: (file: File) => void;
// }

type FileUploaderLayoutRendererProps = ControlProps & WithClassname;

export const FileUploader = ({
  data,

  handleChange,
}: FileUploaderLayoutRendererProps) => {
  const enumerators = useContext(enumContext);
  const uploadTriggerFunction = enumerators.functions.get('upload-file');
  const uploadTrigger = uploadTriggerFunction && uploadTriggerFunction();
  const downloadTriggerFunction = enumerators.functions.get('download-file');
  const downloadTrigger = downloadTriggerFunction && downloadTriggerFunction();
  const lastFileValue = enumerators.getters.get('last-file');
  const lastFile = lastFileValue && lastFileValue();
  const dropdownbFunction = enumerators.functions.get('first-ddd');
  const dropdownb = dropdownbFunction && dropdownbFunction();
  //const uploadTrigger = ()

  function uploadFile(file: File) {
    console.log(JSON.stringify('uploadTigger?'));
    console.log(JSON.stringify(uploadTrigger));
    console.log(JSON.stringify(lastFile) + '<lastFile');
    console.log(JSON.stringify(dropdownb) + '<dropdownb');
    if (uploadTrigger) {
      console.log(JSON.stringify('uploadTigger exists'));
      //handleChange('x', JSON.stringify(file));
      uploadTrigger(file);
    }
  }
  function downloadFile(file: File) {
    console.log(JSON.stringify('downTigger?'));
    if (downloadTrigger) {
      console.log(JSON.stringify('downTigger exists'));
      handleChange('y', JSON.stringify(file));
      downloadTrigger(file);
    }
  }

  useEffect(() => {
    console.log(JSON.stringify(lastFile) + '<lastFile');
    if (lastFile) {
      handleChange(lastFile.urn, JSON.stringify(lastFile));
    }
  }, [lastFile, handleChange]);

  //console.log(JSON.stringify(props, getCircularReplacer()) + '<props');

  interface UiSchema {
    option: string;
  }
  //const uiSchema = uischema as unknown as UiSchema;

  return (
    <div id="file-upload" className="FileUploader">
      <GoAFileUploadInput variant="button" onSelectFile={uploadFile} />
      {lastFile && (
        <div>
          <AttachmentBorder>
            <div>{lastFile.filename}</div>

            <GoAContextMenu>
              <GoAContextMenuIcon
                testId="download-icon"
                title="Download"
                type="download"
                onClick={() => downloadFile(lastFile)}
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
