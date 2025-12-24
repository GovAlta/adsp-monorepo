import React, { useState } from 'react';
import styles from './Editor.module.scss';
import { ContextProviderFactory } from '@abgov/jsonforms-components';
import { JSONFormPreviewer } from './JsonFormPreviewer';
import { GoAFormItem, GoATabs, GoATab } from '@abgov/react-components';
import { RegisterData } from '../../../../../../../libs/jsonforms-components/src';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { FileItem, FileMetadata } from '../../../state/file/file.slice';
import { FileWithMetadata } from '../../../state/file/file.slice';
import { PDFPreviewTemplateCore } from './PDFPreviewTemplateCore';
import { PreviewTop } from './PDFPreviewTemplateCore';
import { PdfJobList } from '../../../state/pdf/pdf.slice';

export const ContextProvider = ContextProviderFactory();

export interface PreviewProps {
  fileList: Record<string, FileMetadata[]>;
  uploadFile: (file: FileWithMetadata, propertyId: string) => void;
  downloadFile: (file: FileItem) => void;
  deleteFile: (file: FileItem) => void;
  formServiceApiUrl: string;
  schemaError: string | null;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  registerData: RegisterData;
  nonAnonymous: string[];
  dataList: string[];
  currentPDF: string;
  pdfFile: FileItem;
  jobList: PdfJobList;
  // eslint-disable-next-line
  generatePdf: (inputData: Record<string, any>) => void;
  loading: boolean;
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
  currentPDF,
  pdfFile,
  jobList,
  generatePdf,
  loading,
}): JSX.Element => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>({});

  return (
    <GoATabs data-testid="preview-tabs">
      <GoATab heading="Preview" data-testid="preview-view-tab">
        <div className={styles['form-preview-scroll-pane']}>
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
        <div className={styles['review-page-tab-wrapper']}>
          {data && <div className={styles.PRE}>{JSON.stringify(data, null, 2)}</div>}
        </div>
      </GoATab>
      <GoATab
        heading={
          <PreviewTop
            title="PDF Preview"
            downloadFile={() => {
              downloadFile(pdfFile);
            }}
            currentPDF={currentPDF}
            generateTemplate={() => generatePdf(data)}
          />
        }
        data-testid="data-view"
      >
        <PDFPreviewTemplateCore jobList={jobList} currentPDF={currentPDF} loading={loading} />
      </GoATab>
    </GoATabs>
  );
};
