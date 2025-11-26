import React, { useState, useEffect } from 'react';
import { GoAButton, GoAIconButton, GoACallout } from '@abgov/react-components';
import _ from 'underscore';
import {
  generatePdf,
  updatePdfResponse,
  showCurrentFilePdf,
  setPdfDisplayFileId,
  getCorePdfTemplates,
  updateTempTemplate,
} from '@store/pdf/action';

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

import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { DownloadFileService } from '@store/file/actions';
import { streamPdfSocket } from '@store/pdf/action';
import { useParams } from 'react-router-dom';
import { PageIndicator } from '@components/Indicator';

import { FetchFileService } from '@store/file/actions';

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
const hasFormName = (jobFileName, formName) => {
  const partFormName = formName.length >= 10 ? formName.substr(0, 10) : formName;
  return jobFileName.indexOf(partFormName) !== -1;
};
export const PDFPreviewTemplateCore = (formName) => {
  const { id } = useParams<{ id: string }>();
  const fileList = useSelector((state: RootState) => state?.fileService?.fileList);

  const pdfTemplate = useSelector(
    (state: RootState) => state.pdf?.corePdfTemplates['submitted-form'] || state?.pdf?.pdfTemplates[id]
  );
  const jobList = useSelector((state: RootState) =>
    state?.pdf?.jobs.filter((job) => job.templateId === pdfTemplate.id && hasFormName(job.filename, formName.formName))
  );
  const pdfGenerationError = jobList?.[0]?.payload?.error;
  const hasError = pdfGenerationError && pdfGenerationError.length > 0;

  const dispatch = useDispatch();

  const [windowSize, setWindowSize] = useState(window.innerHeight);

  const indicator = useSelector((state: RootState) => state?.session?.indicator, _.isEqual);

  const socketChannel = useSelector((state: RootState) => {
    return state?.pdf.socketChannel;
  });
  const reloadFile = useSelector((state: RootState) => state.pdf?.reloadFile);
  const currentId = useSelector((state: RootState) => state?.pdf?.currentId);
  const files = useSelector((state: RootState) => state?.pdf.files);

  useEffect(() => {
    if (reloadFile && reloadFile[pdfTemplate.id]) {
      dispatch(FetchFileService(reloadFile[pdfTemplate.id]));
    }
  }, [reloadFile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socketChannel) {
      dispatch(streamPdfSocket(false));
    }
  }, [socketChannel, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

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
    dispatch(updatePdfResponse({ fileList: fileList }));
    const currentFile = fileList.find((file) => jobList.map((job) => job.id).includes(file.recordId));

    if (currentFile) {
      dispatch(showCurrentFilePdf(currentFile?.id));
    } else {
      dispatch(setPdfDisplayFileId(null));
    }
  }, [dispatch, fileList]);

  const PdfPreview = () => {
    const blob = files[currentId] && base64toBlob(files[currentId], 'application/pdf');

    const blobUrl = blob && URL.createObjectURL(blob);
    return (
      <>
        {indicator?.show && (
          <SpinnerPadding>
            <PageIndicator />
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

export const PreviewTop = ({ title, form, data, currentTab }) => {
  const onDownloadFile = async (file) => {
    file && dispatch(DownloadFileService(file));
  };

  const pdfTemplate = useSelector((state: RootState) => state.pdf?.corePdfTemplates['submitted-form']);
  const fileList = useSelector((state: RootState) => state?.fileService?.fileList);
  const pdfList = useSelector((state: RootState) => state.pdf.jobs, _.isEqual);

  const currentId = useSelector((state: RootState) => state?.pdf?.currentId);
  const files = useSelector((state: RootState) => state?.pdf.files);

  const pdfPreviewTab = 2;
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getCorePdfTemplates());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(updateTempTemplate(pdfTemplate));
  }, [pdfTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTemplate = () => {
    const payload = {
      templateId: PDF_FORM_TEMPLATE_ID,
      data: { definition: form },
      fileName: getFileName(form.name),
      formId: form.name,
      inputData: data,
    };

    dispatch(generatePdf(payload));
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
