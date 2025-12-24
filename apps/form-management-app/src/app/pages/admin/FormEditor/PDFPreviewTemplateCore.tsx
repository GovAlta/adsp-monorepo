import React, { useState, useEffect } from 'react';
import { GoabButton, GoabIconButton, GoabCallout } from '@abgov/react-components';
import styles from './Editor.module.scss';
import { PdfPageIndicator } from '../../../state/pdf/PdfIndicator';
import { PdfJobList } from '../../../state/pdf/pdf.slice';

const base64toBlob = (b64Data: string, contentType: string = '', sliceSize: number = 512): Blob => {
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

interface HasFormNameParams {
  jobList: PdfJobList;
  currentPDF: string;
  loading: boolean;
}

export const PDFPreviewTemplateCore = ({ jobList, currentPDF, loading }: HasFormNameParams) => {
  const pdfGenerationError = jobList?.[0]?.payload?.error;
  const hasError = pdfGenerationError && pdfGenerationError.length > 0;
  const [windowSize, setWindowSize] = useState<number>(window.innerHeight);

  useEffect(() => {
    const handleWindowResize = (): void => {
      if (window.innerHeight !== windowSize) setWindowSize(window.innerHeight);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  const PdfPreview = (): React.ReactElement => {
    const blob = currentPDF && base64toBlob(currentPDF, 'application/pdf');
    const blobUrl = blob && URL.createObjectURL(blob);

    return (
      <div className={styles['pdf-preview-wrapper']}>
        {loading && (
          <div className={styles['spinner-padding']}>
            <PdfPageIndicator />
          </div>
        )}
        {!loading && !hasError && blobUrl && (
          <div>
            <div>
              <object type="application/pdf" data={blobUrl} height={windowSize - 92} style={{ width: '100%' }}>
                <iframe title={'PDF preview'} src={blobUrl} height="100%" width="100%"></iframe>
              </object>
            </div>
          </div>
        )}
        {!loading && hasError && (
          <GoabCallout type="emergency" heading="Error in PDF generation">
            {pdfGenerationError}
          </GoabCallout>
        )}
      </div>
    );
  };

  return (
    jobList.length > 0 && (
      <div className={styles['preview-container']}>
        <PdfPreview />
      </div>
    )
  );
};

export const PreviewTop = ({
  title,
  downloadFile,
  currentPDF,
  generateTemplate,
}: {
  title: string;
  downloadFile: () => void;
  currentPDF: string;
  generateTemplate: () => void;
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ marginRight: '0.5rem' }} className={styles['form-title']}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '-8px' }}>
        <div style={{ scale: '86%', marginTop: '-2px' }}>
          <GoabButton
            type="secondary"
            testId="generate-template"
            size="compact"
            onClick={() => {
              generateTemplate();
            }}
          >
            Generate PDF
          </GoabButton>
        </div>
        <div style={{ scale: '86%', marginTop: '-3px' }}>
          <GoabIconButton
            icon="download"
            title="Download"
            testId="download-template-icon"
            size="medium"
            disabled={!currentPDF}
            onClick={() => {
              downloadFile();
            }}
          />
        </div>
      </div>
    </div>
  );
};
