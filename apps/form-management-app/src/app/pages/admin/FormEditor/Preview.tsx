import React, { useRef, useState } from 'react';
import { ContextProviderFactory } from '@abgov/jsonforms-components';
import styled from 'styled-components';
import { JSONFormPreviewer } from './JsonFormPreviewer';
import { NameDescriptionDataSchema, FormPreviewScrollPane, ReviewPageTabWrapper, PRE } from './styled-components';

import { useWindowDimensions } from '../../../components/useWindowDimensions';
import { GoAFormItem } from '@abgov/react-components';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { Tab, Tabs} from '../../../components/Tabs'
import { PreviewTop } from '../../../../../../../libs/form-editor-common/src/lib/definitions/PDFPreviewTemplateCore';
import { FormDefinition } from '../../../state/types';

export const ContextProvider = ContextProviderFactory();

export interface PreviewProps {
  fileList: any;
  uploadFile: any;
  downloadFile: any;
  deleteFile: any;
  formServiceApiUrl: string;
  schemaError: any;
  definition: FormDefinition;
  dataSchema: any;
  uiSchema: any;
  registerData: any;
  nonAnonymous: any;
  dataList: any;
}


export const Preview: React.FC<PreviewProps> = ({
  fileList,
  uploadFile,
  downloadFile,
  deleteFile,
  formServiceApiUrl,
  schemaError,
  definition,
  dataSchema,
  uiSchema,
  registerData,
  nonAnonymous,
  dataList,
}): JSX.Element => {
    const [data, setData] = useState<unknown>({});
    const [currentTab, setCurrentTab] = useState(0);

    const saveCurrentTab = (tab: number) => {
      setCurrentTab(tab);
    };



  return (
    <div>
      <Tabs data-testid="preview-tabs" activeIndex={0} changeTabCallback={saveCurrentTab}>
        <Tab label="Preview" data-testid="preview-view-tab">
          <FormPreviewScrollPane>
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
          </FormPreviewScrollPane>
        </Tab>
        <Tab label="Data" data-testid="data-view">
          <ReviewPageTabWrapper>{data && <PRE>{JSON.stringify(data, null, 2)}</PRE>}</ReviewPageTabWrapper>
        </Tab>
        {definition?.submissionPdfTemplate ? (
          <Tab
            label={<PreviewTop title="PDF Preview" form={definition} data={data} currentTab={currentTab} />}
            data-testid="data-view"
          >
            <PDFPreviewTemplateCore formName={definition.name} />
          </Tab>
        ) : null}
      </Tabs>
    </div>
  );
};

const Main = styled.div`
  flex: 1 1 auto;
  padding: var(--goa-space-l, 24px) 0;
`;

const AdminLayout = styled.div`
  display: flex;
`;
