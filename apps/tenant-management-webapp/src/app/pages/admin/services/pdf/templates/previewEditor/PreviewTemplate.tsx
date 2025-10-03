import React, { useState, useEffect } from 'react';
import { GoAButton, GoAIconButton, GoACallout } from '@abgov/react-components';

import { isEqual } from 'underscore';
import { generatePdf, updatePdfResponse, showCurrentFilePdf, setPdfDisplayFileId } from '@store/pdf/action';

import {
  SpinnerPadding,
  PreviewTopStyle,
  PreviewTopStyleWrapper,
  PreviewContainer,
  PDFTitle,
  PreviewWrapper,
  PdfViewer,
} from '../../styled-components';

import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { DownloadFileService } from '@store/file/actions';
import { streamPdfSocket } from '@store/pdf/action';
import { useParams } from 'react-router-dom';
import { PageIndicator } from '@components/Indicator';

interface PreviewTemplateProps {
  channelTitle: string;
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

export const PreviewTemplate = ({ channelTitle }: PreviewTemplateProps) => {
  const { id } = useParams<{ id: string }>();
  const fileList = useSelector((state: RootState) => state?.fileService?.fileList);
  const pdfTemplate = useSelector((state: RootState) => state?.pdf?.pdfTemplates[id]);
  const jobList = useSelector((state: RootState) =>
    state?.pdf?.jobs.filter((job) => job.templateId === pdfTemplate.id)
  );
  const pdfGenerationError = jobList?.[0]?.payload?.error;
  const hasError = pdfGenerationError && pdfGenerationError.length > 0;

  useEffect(() => {
    dispatch(updatePdfResponse({ fileList: fileList }));
    const currentFile = fileList.find((file) => jobList.map((job) => job.id).includes(file.recordId));
    if (currentFile) {
      dispatch(showCurrentFilePdf(currentFile?.id));
    } else {
      dispatch(setPdfDisplayFileId(null));
    }
  }, [fileList]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTemplate = () => {
    const payload = {
      templateId: pdfTemplate.id,
      data: pdfTemplate.variables ? JSON.parse(pdfTemplate.variables) : {},
      fileName: `${pdfTemplate.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
    };

    dispatch(generatePdf(payload));
  };
  const [windowSize, setWindowSize] = useState(window.innerHeight);

  const dispatch = useDispatch();

  const indicator = useSelector((state: RootState) => state?.session?.indicator, isEqual);

  const files = useSelector((state: RootState) => state?.pdf.files);

  const currentId = useSelector((state: RootState) => state?.pdf?.currentId);

  const socketChannel = useSelector((state: RootState) => {
    return state?.pdf.socketChannel;
  });
  useEffect(() => {
    if (!socketChannel) {
      dispatch(streamPdfSocket(false));
    }
  }, [socketChannel, dispatch]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerHeight !== windowSize) setWindowSize(window.innerHeight);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  const pdfList = useSelector((state: RootState) => state.pdf.jobs, isEqual);
  const onDownloadFile = async (file) => {
    file && dispatch(DownloadFileService(file));
  };

  const PdfPreview = () => {
    const blob = files[currentId] && base64toBlob(files[currentId], 'application/pdf');

    const blobUrl = blob && URL.createObjectURL(blob);

    return (
      <>
        <PreviewWrapper>
          <section>
            <PreviewTop title={channelTitle} iconDisable={!blobUrl} />
            {indicator?.show && (
              <SpinnerPadding>
                <PageIndicator />
              </SpinnerPadding>
            )}
            {!indicator?.show && !hasError && blobUrl && (
              <PdfViewer>
                <object type="application/pdf" data={blobUrl} height={windowSize - 202} style={{ width: '100%' }}>
                  <iframe title={'PDF preview'} src={blobUrl} height="100%" width="100%"></iframe>
                </object>
              </PdfViewer>
            )}
          </section>
        </PreviewWrapper>
        {!indicator?.show && hasError && (
          <GoACallout type="emergency" heading="Error in PDF generation">
            {pdfGenerationError}
          </GoACallout>
        )}
      </>
    );
  };

  const PreviewTop = ({ title, iconDisable }) => {
    return (
      <PreviewTopStyleWrapper>
        <PreviewTopStyle>
          <PDFTitle>{title}</PDFTitle>

          <GoAButton
            disabled={indicator.show || pdfTemplate === null}
            type="secondary"
            testId="generate-template"
            size="compact"
            onClick={() => {
              generateTemplate();
            }}
          >
            Generate PDF
          </GoAButton>

          <GoAIconButton
            icon="download"
            title="Download"
            testId="download-template-icon"
            size="medium"
            disabled={iconDisable}
            onClick={() => {
              const file = fileList[0];
              if (file.recordId === pdfList[0].id && file.filename.indexOf(pdfList[0].templateId) > -1) {
                onDownloadFile(file);
              }
            }}
          />
        </PreviewTopStyle>
        <hr />
      </PreviewTopStyleWrapper>
    );
  };

  return (
    <PreviewContainer>
      <PdfPreview />
    </PreviewContainer>
  );
};
