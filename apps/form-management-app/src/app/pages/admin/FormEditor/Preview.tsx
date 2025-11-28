import React, { useState } from 'react';
import './Editor.scss';
import { ContextProviderFactory } from '@abgov/jsonforms-components';
import { JSONFormPreviewer } from './JsonFormPreviewer';
import { GoAFormItem, GoATabs, GoATab } from '@abgov/react-components';

import { FormDefinition } from '../../../state/types';
import { RegisterData } from '../../../../../../../libs/jsonforms-components/src';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';

export const ContextProvider = ContextProviderFactory();

export interface PreviewProps {
  fileList: Record<string, Record<string, string>[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadFile: (file: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  downloadFile: (file: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteFile: (file: any) => void;
  formServiceApiUrl: string;
  schemaError: string | null;
  definition: FormDefinition;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;

  registerData: RegisterData;
  nonAnonymous: string[];
  dataList: string[];
}

export const Preview: React.FC<PreviewProps> = ({
  fileList,
  uploadFile,
  downloadFile,
  deleteFile,
  formServiceApiUrl,
  schemaError,
  dataSchema,
  uiSchema,
  registerData,
  nonAnonymous,
  dataList,
}): JSX.Element => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>({});

  return (
    <div>
      <GoATabs data-testid="preview-tabs">
        <GoATab heading="Preview" data-testid="preview-view-tab">
          <div className="form-preview-scroll-pane">
            <ContextProvider
              fileManagement={{
                fileList: fileList,
                uploadFile: uploadFile,
                downloadFile: downloadFile,
                deleteFile: deleteFile,
              }}
              formUrl={formServiceApiUrl}
            >
              <GoAFormItem error={schemaError} label="">
                <JSONFormPreviewer
                  onChange={({ data }) => {
                    setData(data);
                  }}
                  data={data}
                  dataSchema={dataSchema}
                  uiSchema={uiSchema}
                  error={schemaError}
                  registerData={registerData}
                  nonAnonymous={nonAnonymous}
                  dataList={dataList}
                />
              </GoAFormItem>
            </ContextProvider>
          </div>
        </GoATab>

        <GoATab heading="Data" data-testid="data-view">
          <div className="review-page-tab-wrapper">
            {data && <div className="PRE">{JSON.stringify(data, null, 2)}</div>}
          </div>
        </GoATab>
      </GoATabs>
    </div>
  );
};
