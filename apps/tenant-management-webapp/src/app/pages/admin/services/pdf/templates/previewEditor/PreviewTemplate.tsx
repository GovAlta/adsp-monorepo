import React, { useState, useEffect, useRef } from 'react';
import { GoabButton, GoabIconButton, GoabCallout } from '@abgov/react-components';
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
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { DownloadFileService } from '@store/file/actions';
import { streamPdfSocket } from '@store/pdf/action';
import { useParams } from 'react-router-dom';
import { PageIndicator, IndicatorWithDelay, Center } from '@components/Indicator';
import { FileItem } from '@store/file/models';
import { PdfGenerationResponse } from '@store/pdf/model';

interface PreviewTemplateProps {
  channelTitle: string;
}

interface PreviewTopProps {
  title: string;
  iconDisable: boolean;
  indicatorVisible: boolean;
  isGenerating: boolean;
  pdfTemplateMissing: boolean;
  onGenerate: () => void;
  onDownload: () => void;
}

interface PdfPreviewProps {
  blobUrl: string | null;
  channelTitle: string;
  hasError: boolean;
  indicatorVisible: boolean;
  isGenerating: boolean;
  pdfGenerationError: string;
  windowSize: number;
  pdfTemplateMissing: boolean;
  onGenerate: () => void;
  onDownload: () => void;
}

const base64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
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

const getPdfBlob = (pdfFile: Blob | string | null | undefined): Blob | null => {
  if (!pdfFile) {
    return null;
  }

  if (pdfFile instanceof Blob) {
    return pdfFile;
  }

  if (typeof pdfFile === 'string') {
    const base64Data = pdfFile.startsWith('data:') ? pdfFile.split(',')[1] : pdfFile;
    if (!base64Data) {
      return null;
    }

    try {
      return base64toBlob(base64Data, 'application/pdf');
    } catch {
      return null;
    }
  }

  return null;
};

const getDownloadableFile = (fileList: FileItem[], pdfList: PdfGenerationResponse[]): FileItem | null => {
  const file = fileList?.[0];
  const pdf = pdfList?.[0];

  if (!file || !pdf) {
    return null;
  }

  return file.recordId === pdf.id && file.filename && file.filename.indexOf(pdf.templateId) > -1 ? file : null;
};

const PreviewTop = ({
  title,
  iconDisable,
  indicatorVisible,
  isGenerating,
  pdfTemplateMissing,
  onGenerate,
  onDownload,
}: PreviewTopProps) => {
  return (
    <PreviewTopStyleWrapper>
      <PreviewTopStyle>
        <PDFTitle>{title}</PDFTitle>

        <GoabButton
          disabled={indicatorVisible || isGenerating || pdfTemplateMissing}
          type="secondary"
          testId="generate-template"
          size="compact"
          onClick={onGenerate}
        >
          Generate PDF
        </GoabButton>

        <GoabIconButton
          icon="download"
          title="Download"
          testId="download-template-icon"
          size="medium"
          disabled={iconDisable}
          onClick={onDownload}
        />
      </PreviewTopStyle>
      <hr />
    </PreviewTopStyleWrapper>
  );
};

const PdfPreview = ({
  blobUrl,
  channelTitle,
  hasError,
  indicatorVisible,
  isGenerating,
  pdfGenerationError,
  windowSize,
  pdfTemplateMissing,
  onGenerate,
  onDownload,
}: PdfPreviewProps) => {
  return (
    <>
      <PreviewWrapper>
        <section>
          <PreviewTop
            title={channelTitle}
            iconDisable={!blobUrl}
            indicatorVisible={indicatorVisible}
            isGenerating={isGenerating}
            pdfTemplateMissing={pdfTemplateMissing}
            onGenerate={onGenerate}
            onDownload={onDownload}
          />
          {indicatorVisible && (
            <SpinnerPadding>
              <PageIndicator />
            </SpinnerPadding>
          )}
          {!indicatorVisible && isGenerating && (
            <SpinnerPadding>
              <Center>
                <IndicatorWithDelay message="Processing may take a while. Please wait..." />
              </Center>
            </SpinnerPadding>
          )}
          {!indicatorVisible && !isGenerating && !hasError && blobUrl && (
            <PdfViewer>
              <object type="application/pdf" data={blobUrl} height={windowSize - 202} style={{ width: '100%' }}>
                <iframe title={'PDF preview'} src={blobUrl} height="100%" width="100%"></iframe>
              </object>
            </PdfViewer>
          )}
        </section>
      </PreviewWrapper>
      {!indicatorVisible && !isGenerating && hasError && (
        <GoabCallout type="emergency" heading="Error in PDF generation">
          {pdfGenerationError}
        </GoabCallout>
      )}
    </>
  );
};

export const PreviewTemplate = ({ channelTitle }: PreviewTemplateProps) => {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const fileList = useSelector((state: RootState) => state?.fileService?.fileList || []);
  const pdfTemplate = useSelector((state: RootState) => (id ? state?.pdf?.pdfTemplates[id] : undefined));
  const jobList = useSelector((state: RootState) =>
    state?.pdf?.jobs.filter((job) => job.templateId === pdfTemplate?.id),
  );
  const pdfGenerationError = jobList?.[0]?.payload?.error;
  const hasError = Boolean(pdfGenerationError && pdfGenerationError.length > 0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingCurrentIdRef = useRef<string | null>(null);

  useEffect(() => {
    dispatch(updatePdfResponse({ fileList: fileList }));
    const jobIds = new Set(jobList.map((job) => job.id));
    const currentFile = fileList.find((file) => file.recordId && jobIds.has(file.recordId));
    if (currentFile?.id) {
      dispatch(showCurrentFilePdf(currentFile.id));
    } else {
      dispatch(setPdfDisplayFileId(''));
    }
  }, [fileList]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTemplate = () => {
    if (!pdfTemplate?.id) {
      return;
    }

    const payload = {
      templateId: pdfTemplate.id,
      data: pdfTemplate.variables ? JSON.parse(pdfTemplate.variables) : {},
      fileName: `${pdfTemplate.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
    };

    generatingCurrentIdRef.current = currentId;
    setIsGenerating(true);
    dispatch(generatePdf(payload));
  };

  const [windowSize, setWindowSize] = useState(window.innerHeight);

  const indicator = useSelector((state: RootState) => state?.session?.indicator, shallowEqual);

  const files = useSelector((state: RootState) => state?.pdf.files as Record<string, Blob | string>);

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
      setWindowSize((currentWindowSize) =>
        window.innerHeight === currentWindowSize ? currentWindowSize : window.innerHeight,
      );
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const currentPdfFile = currentId ? files[currentId] : null;

  useEffect(() => {
    const currentPdfBlob = getPdfBlob(currentPdfFile);

    if (!currentPdfBlob) {
      setBlobUrl(null);
      return;
    }

    const nextBlobUrl = URL.createObjectURL(currentPdfBlob);
    setBlobUrl(nextBlobUrl);

    return () => {
      URL.revokeObjectURL(nextBlobUrl);
    };
  }, [currentId, currentPdfFile]);

  useEffect(() => {
    if (isGenerating && currentId && currentId !== generatingCurrentIdRef.current && files[currentId]) {
      setIsGenerating(false);
    }
  }, [isGenerating, currentId, files]);

  useEffect(() => {
    if (isGenerating && hasError) {
      setIsGenerating(false);
    }
  }, [isGenerating, hasError]);

  const pdfList = useSelector((state: RootState) => state.pdf.jobs);
  const onDownloadFile = async (file: FileItem) => {
    dispatch(DownloadFileService(file));
  };

  const onDownload = () => {
    const file = getDownloadableFile(fileList, pdfList);
    if (file) {
      onDownloadFile(file);
    }
  };

  return (
    <PreviewContainer>
      <PdfPreview
        blobUrl={blobUrl}
        channelTitle={channelTitle}
        hasError={hasError}
        indicatorVisible={Boolean(indicator?.show)}
        isGenerating={isGenerating}
        pdfGenerationError={pdfGenerationError || ''}
        windowSize={windowSize}
        pdfTemplateMissing={!pdfTemplate}
        onGenerate={generateTemplate}
        onDownload={onDownload}
      />
    </PreviewContainer>
  );
};
