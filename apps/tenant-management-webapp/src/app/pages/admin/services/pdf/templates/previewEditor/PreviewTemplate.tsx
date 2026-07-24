import React, { useState, useEffect, useRef } from 'react';
import { GoabButton, GoabIconButton, GoabCallout } from '@abgov/react-components';
import _ from 'underscore';
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
import { PageIndicator, IndicatorWithDelay, Center } from '@components/Indicator';
import useWindowDimensions from '@lib/useWindowDimensions';

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
  const dispatch = useDispatch();

  const fileList = useSelector((state: RootState) => state?.fileService?.fileList);
  const pdfTemplate = useSelector((state: RootState) => state?.pdf?.pdfTemplates[id]);
  const jobList = useSelector((state: RootState) =>
    state?.pdf?.jobs.filter((job) => job.templateId === pdfTemplate.id),
  );
  const indicator = useSelector((state: RootState) => state?.session?.indicator, _.isEqual);
  const files = useSelector((state: RootState) => state?.pdf.files);
  const currentId = useSelector((state: RootState) => state?.pdf?.currentId);
  const socketChannel = useSelector((state: RootState) => state?.pdf.socketChannel);
  const pdfList = useSelector((state: RootState) => state.pdf.jobs, _.isEqual);

  const pdfGenerationError = jobList?.[0]?.payload?.error;
  const hasError = pdfGenerationError && pdfGenerationError.length > 0;

  const { height: windowSize } = useWindowDimensions();
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingCurrentIdRef = useRef<string>(null);

  useEffect(() => {
    dispatch(updatePdfResponse({ fileList: fileList }));
    const currentFile = fileList.find((file) => jobList.map((job) => job.id).includes(file.recordId));
    if (currentFile) {
      dispatch(showCurrentFilePdf(currentFile?.id));
    } else {
      dispatch(setPdfDisplayFileId(null));
    }
  }, [fileList]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isGenerating && currentId && currentId !== generatingCurrentIdRef.current && files[currentId]) {
      setIsGenerating(false);
    }
  }, [isGenerating, currentId, files]);

  useEffect(() => {
    if (!socketChannel) {
      dispatch(streamPdfSocket(false));
    }
  }, [socketChannel, dispatch]);

  const generateTemplate = () => {
    const payload = {
      templateId: pdfTemplate.id,
      data: pdfTemplate.variables ? JSON.parse(pdfTemplate.variables) : {},
      fileName: `${pdfTemplate.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
    };
    generatingCurrentIdRef.current = currentId;
    setIsGenerating(true);
    dispatch(generatePdf(payload));
  };

  const onDownloadFile = async (file) => {
    file && dispatch(DownloadFileService(file));
  };

  const blob = files[currentId] && base64toBlob(files[currentId], 'application/pdf');
  const blobUrl = blob && URL.createObjectURL(blob);

  return (
    <PreviewContainer>
      <PreviewWrapper>
        <section>
          <PreviewTopStyleWrapper>
            <PreviewTopStyle>
              <PDFTitle>{channelTitle}</PDFTitle>

              <GoabButton
                disabled={indicator.show || isGenerating || pdfTemplate === null}
                type="secondary"
                testId="generate-template"
                size="compact"
                onClick={() => {
                  generateTemplate();
                }}
              >
                Generate PDF
              </GoabButton>

              <GoabIconButton
                icon="download"
                title="Download"
                testId="download-template-icon"
                size="medium"
                disabled={!blobUrl}
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

          {indicator?.show && (
            <SpinnerPadding>
              <PageIndicator />
            </SpinnerPadding>
          )}
          {!indicator?.show && isGenerating && (
            <SpinnerPadding>
              <Center>
                <IndicatorWithDelay message="Processing may take a while. Please wait..." />
              </Center>
            </SpinnerPadding>
          )}
          {!indicator?.show && !isGenerating && !hasError && blobUrl && (
            <PdfViewer>
              <object type="application/pdf" data={blobUrl} height={windowSize - 202} style={{ width: '100%' }}>
                <iframe title={'PDF preview'} src={blobUrl} height="100%" width="100%"></iframe>
              </object>
            </PdfViewer>
          )}
        </section>
      </PreviewWrapper>
      {!indicator?.show && !isGenerating && hasError && (
        <GoabCallout type="emergency" heading="Error in PDF generation">
          {pdfGenerationError}
        </GoabCallout>
      )}
    </PreviewContainer>
  );
};
