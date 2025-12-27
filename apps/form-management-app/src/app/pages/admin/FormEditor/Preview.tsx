import React, { useState } from 'react';
import styles from './Editor.module.scss';
import { ContextProviderFactory } from '@abgov/jsonforms-components';
import { JSONFormPreviewer } from './JsonFormPreviewer';
import { GoabFormItem, GoabTabs, GoabTab } from '@abgov/react-components';
import { RegisterData } from '../../../../../../../libs/jsonforms-components/src';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { FileItem, FileMetadata } from '../../../state/file/file.slice';
import { FileWithMetadata } from '../../../state/file/file.slice';
import { PDFPreviewTemplateCore } from './PDFPreviewTemplateCore';
import { PreviewTop } from './PDFPreviewTemplateCore';
import { PdfJobList } from '../../../state/pdf/pdf.slice';
import { FormDefinition } from '../../../state';

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
  definition: FormDefinition;
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
  definition,
}): JSX.Element => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>({});

  const tabs = React.useMemo(() => {
    if (definition?.submissionPdfTemplate) {
      return (
        <>
          <GoabTab heading="Preview" data-testid="preview-view-tab">
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
                <GoabFormItem error={schemaError} label="">
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
                </GoabFormItem>
              </ContextProvider>
            </div>
          </GoabTab>
          <GoabTab heading="Data" data-testid="data-view">
            <div className={styles['review-page-tab-wrapper']}>
              {data && <div className={styles.PRE}>{JSON.stringify(data, null, 2)}</div>}
            </div>
          </GoabTab>
          <GoabTab
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
            data-testid="preview-view"
          >
            <PDFPreviewTemplateCore jobList={jobList} currentPDF={currentPDF} loading={loading} />
          </GoabTab>
        </>
      );
    }

    return (
      <>
        <GoabTab heading="Preview" data-testid="preview-view-tab">
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
              <GoabFormItem error={schemaError} label="">
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
              </GoabFormItem>
            </ContextProvider>
          </div>
        </GoabTab>
        <GoabTab heading="Data" data-testid="data-view">
          <div className={styles['review-page-tab-wrapper']}>
            {data && <div className={styles.PRE}>{JSON.stringify(data, null, 2)}</div>}
          </div>
        </GoabTab>
      </>
    );
  }, [definition?.submissionPdfTemplate, data, dataSchema, uiSchema, schemaError, fileList, pdfFile, currentPDF, jobList, loading]);



  return (
    <GoabTabs key={definition?.submissionPdfTemplate ? 'with-pdf' : 'no-pdf'} data-testid="preview-tabs">
      {tabs}
    </GoabTabs>
  );
};
