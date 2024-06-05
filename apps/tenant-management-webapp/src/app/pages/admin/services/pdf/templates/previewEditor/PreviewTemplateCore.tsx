import React, { useState, useEffect } from 'react';
import { GoAButton, GoAIconButton, GoACallout, GoADropdown, GoADropdownItem } from '@abgov/react-components-new';
import _ from 'underscore';
import { generatePdf, updatePdfResponse, showCurrentFilePdf, setPdfDisplayFileId } from '@store/pdf/action';

import {
  SpinnerPadding,
  PreviewTopStyle,
  PreviewTopStyleWrapper,
  PreviewContainer,
  PDFTitle,
} from '../../styled-components';

import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { DownloadFileService } from '@store/file/actions';
import { streamPdfSocket } from '@store/pdf/action';
import { useParams } from 'react-router-dom';
import { PageIndicator } from '@components/Indicator';
import { getFormDefinitions } from '@store/form/action';

interface PreviewTemplateProps {
  channelTitle: string;
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

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

export const PreviewTemplateCore = ({ channelTitle }: PreviewTemplateProps) => {
  const { id } = useParams<{ id: string }>();
  const fileList = useSelector((state: RootState) => state?.fileService?.fileList);
  //const pdfTemplate = useSelector((state: RootState) => state?.pdf?.pdfTemplates[id]);
  const pdfTemplate = useSelector(
    (state: RootState) => state.pdf?.corePdfTemplates[id] || state?.pdf?.pdfTemplates[id]
  );
  const jobList = useSelector((state: RootState) =>
    state?.pdf?.jobs.filter((job) => job.templateId === pdfTemplate.id)
  );
  const pdfGenerationError = jobList?.[0]?.payload?.error;
  const hasError = pdfGenerationError && pdfGenerationError.length > 0;

  const [formId, setFormId] = useState('');

  const formDefinitions = useSelector((state: RootState) => {
    return Object.keys(state?.form?.definitions);
  });

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(updatePdfResponse({ fileList: fileList }));
    const currentFile = fileList.find((file) => jobList.map((job) => job.id).includes(file.recordId));
    if (currentFile) {
      dispatch(showCurrentFilePdf(currentFile?.id));
    } else {
      dispatch(setPdfDisplayFileId(null));
    }
  }, [fileList]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTemplate = (formId?: string) => {
    const payload = {
      templateId: pdfTemplate.id,
      data: pdfTemplate.variables ? JSON.parse(pdfTemplate.variables) : {},
      fileName: `${pdfTemplate.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
      formId: formId,
    };

    dispatch(generatePdf(payload));
  };

  useEffect(() => {
    if (Object.keys(formDefinitions).length === 0) {
      dispatch(getFormDefinitions());
    }
  }, [dispatch]);
  const [windowSize, setWindowSize] = useState(window.innerHeight);

  const indicator = useSelector((state: RootState) => state?.session?.indicator, _.isEqual);

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

  const pdfList = useSelector((state: RootState) => state.pdf.jobs, _.isEqual);
  const onDownloadFile = async (file) => {
    file && dispatch(DownloadFileService(file));
  };

  const PdfPreview = () => {
    const blob = files[currentId] && base64toBlob(files[currentId], 'application/pdf');

    const blobUrl = blob && URL.createObjectURL(blob);

    return (
      <>
        <PreviewTop title={channelTitle} iconDisable={!blobUrl} />
        {indicator?.show && (
          <SpinnerPadding>
            <PageIndicator />
          </SpinnerPadding>
        )}
        {!indicator?.show && !hasError && blobUrl && (
          <div>
            <div>
              <object type="application/pdf" data={blobUrl} height={windowSize - 200} style={{ width: '100%' }}>
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

  const PreviewTop = ({ title, iconDisable }) => {
    return (
      <PreviewTopStyleWrapper>
        <PreviewTopStyle>
          <PDFTitle>{title}</PDFTitle>
          <div style={{ scale: '0.80', margin: '-5px' }}>
            <GoADropdown value={formId} onChange={(_, id) => setFormId(id as string)} relative={true}>
              {formDefinitions.length > 0 &&
                formDefinitions.map((w, index) => <GoADropdownItem key={index} value={w} label={w} />)}
            </GoADropdown>
          </div>
          <GoAButton
            disabled={indicator.show || pdfTemplate === null || formId.length === 0}
            type="secondary"
            testId="generate-template"
            size="compact"
            onClick={() => {
              if (formId) {
                generateTemplate(formId);
              } else {
                generateTemplate();
              }
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
        <hr className="hr-resize" />
      </PreviewTopStyleWrapper>
    );
  };

  return (
    <PreviewContainer>
      <PdfPreview />
    </PreviewContainer>
  );
};
