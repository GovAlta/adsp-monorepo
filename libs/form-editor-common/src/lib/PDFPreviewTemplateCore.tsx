import React, { useState, useEffect } from 'react';
import { GoAButton, GoAIconButton, GoACallout } from '@abgov/react-components';
import { generatePdf, getCorePdfTemplates, updateTempTemplate } from '@store/pdf/action';

import {
  SpinnerPadding,
  PreviewTopStyle,
  PreviewTopStyleWrapper,
  PreviewContainer,
  FormTitle,
  DisplayFlex,
  ButtonIconPadding,
  ButtonIconPaddingThree,
} from '../styled-components';

import { useParams } from 'react-router-dom';
import { PageIndicator } from '../components/Indicator';

export interface FileItem {
  id?: string;
  filename?: string;
  size?: number;
  fileURN?: string;
  urn: string;
  typeName?: string;
  recordId?: string;
  created?: string;
  lastAccessed?: string;
  propertyId?: string;
}

const base64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};
const PDF_FORM_TEMPLATE_ID = 'submitted-form';

const getFileName = (formName) =>
  `${PDF_FORM_TEMPLATE_ID}_${formName.length >= 10 ? formName.substr(0, 10) : formName}_${new Date()
    .toJSON()
    .slice(0, 19)
    .replace(/:/g, '-')}.pdf`;

export const PDFPreviewTemplateCore = ({
  FetchFileService,
  streamPdfSocket,
  updatePdfResponse,
  showCurrentFilePdf,
  setPdfDisplayFileId,
  fileList,
  pdfTemplate,
  jobList,
  indicator,
  socketChannel,
  reloadFile,
  currentId,
  files,
}) => {
  const { id } = useParams<{ id: string }>();
  const [windowSize, setWindowSize] = useState(window.innerHeight);

  console.log(JSON.stringify(files) + '><files');
  console.log(JSON.stringify(currentId) + '><currentId');
  console.log(JSON.stringify(reloadFile) + '><reloadFile');
  console.log(JSON.stringify(socketChannel) + '><socketChannel');
  console.log(JSON.stringify(indicator) + '><indicator');
  console.log(JSON.stringify(jobList) + '><jobList');
  console.log(JSON.stringify(pdfTemplate) + '><pdfTemplate');
  console.log(JSON.stringify(fileList) + '><fileList');

  const pdfGenerationError = jobList?.[0]?.payload?.error;
  const hasError = pdfGenerationError && pdfGenerationError.length > 0;

  useEffect(() => {
    if (reloadFile && reloadFile[pdfTemplate.id]) {
      FetchFileService(reloadFile[pdfTemplate.id]);
    }
  }, [reloadFile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socketChannel) {
      streamPdfSocket(false);
    }
  }, [socketChannel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerHeight !== windowSize) setWindowSize(window.innerHeight);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  useEffect(() => {
    console.log(JSON.stringify(fileList) + '<fileList--');
    updatePdfResponse(fileList);
    const currentFile = fileList.find((file) => jobList.map((job) => job.id).includes(file.recordId));

    if (currentFile) {
      showCurrentFilePdf(currentFile?.id);
    } else {
      setPdfDisplayFileId(null);
    }
  }, [fileList]);

  const PdfPreview = () => {
    const blob = files[currentId] && base64toBlob(files[currentId], 'application/pdf');

    const blobUrl = blob && URL.createObjectURL(blob);
    return (
      <>
        {indicator?.show && (
          <SpinnerPadding>
            <PageIndicator indicator={indicator} />
          </SpinnerPadding>
        )}
        {!indicator?.show && !hasError && blobUrl && (
          <div>
            <div>
              <object type="application/pdf" data={blobUrl} height={windowSize - 192} style={{ width: '100%' }}>
                <iframe title={'PDF preview'} src={blobUrl} height="100%" width="100%"></iframe>
              </object>
            </div>
          </div>
        )}
        {!indicator?.show && hasError && (
          <GoACallout type="emergency" heading="Error in PDF generation">
            {pdfGenerationError}
          </GoACallout>
        )}
      </>
    );
  };

  return (
    jobList.length > 0 && (
      <PreviewContainer>
        <PdfPreview />
      </PreviewContainer>
    )
  );
};

export const PreviewTop = ({
  title,
  form,
  data,
  currentTab,
  pdfTemplate,
  fileList,
  pdfList,
  currentId,
  files,
  DownloadFileService,
  getCorePdfTemplates,
  updateTempTemplate,
  generatePdf,
}) => {
  const onDownloadFile = async (file) => {
    file && DownloadFileService(file);
  };

  const pdfPreviewTab = 2;
 
  useEffect(() => {
    getCorePdfTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    updateTempTemplate(pdfTemplate);
  }, [pdfTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTemplate = () => {
    const payload = {
      templateId: PDF_FORM_TEMPLATE_ID,
      data: { definition: form },
      fileName: getFileName(form.name),
      formId: form.name,
      inputData: data,
    };

   generatePdf(payload);
  };

  return (
    <PreviewTopStyleWrapper>
      <PreviewTopStyle>
        <FormTitle>{title}</FormTitle>
        {currentTab === pdfPreviewTab && (
          <DisplayFlex>
            <ButtonIconPaddingThree>
              <GoAButton
                type="secondary"
                testId="generate-template"
                size="compact"
                onClick={() => {
                  generateTemplate();
                }}
              >
                Generate PDF
              </GoAButton>
            </ButtonIconPaddingThree>
            <ButtonIconPadding>
              <GoAIconButton
                icon="download"
                title="Download"
                testId="download-template-icon"
                size="medium"
                disabled={!files[currentId]}
                onClick={() => {
                  const file = fileList[0];
                  if (file.recordId === pdfList[0].id && file.filename.indexOf(pdfList[0].templateId) > -1) {
                    onDownloadFile(file);
                  }
                }}
              />
            </ButtonIconPadding>
          </DisplayFlex>
        )}
      </PreviewTopStyle>
    </PreviewTopStyleWrapper>
  );
};
