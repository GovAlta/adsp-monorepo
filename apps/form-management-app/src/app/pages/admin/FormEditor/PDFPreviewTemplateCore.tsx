import React, { useState, useEffect } from 'react';
import { GoabButton, GoabIconButton, GoabCallout } from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import { UpdateIndicator } from '@store/session/actions';
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
    (jobList.length > 0 || loading) && (
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
  loading,
}: {
  title: string;
  downloadFile: () => void;
  currentPDF: string;
  generateTemplate: () => void;
  loading?: boolean;
}) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const previousLoadingRef = React.useRef(false);
  const previousPdfRef = React.useRef<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (loading) {
      setIsButtonDisabled(true);
      previousLoadingRef.current = true;

      timeoutRef.current = setTimeout(() => {
        setIsButtonDisabled(false);
        dispatch(
          UpdateIndicator({
            show: true,
            message: 'PDF generation is taking longer than expected. Button has been re-enabled.',
          })
        );
        setTimeout(() => {
          dispatch(UpdateIndicator({ show: false }));
        }, 3000);
      }, 60000); // 60 seconds
    } else if (previousLoadingRef.current && !loading && currentPDF && currentPDF !== previousPdfRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsButtonDisabled(false);
      previousLoadingRef.current = false;
      previousPdfRef.current = currentPDF;

      dispatch(
        UpdateIndicator({
          show: true,
          message: 'PDF generated successfully',
        })
      );

      setTimeout(() => {
        dispatch(UpdateIndicator({ show: false }));
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, currentPDF, dispatch]);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <div style={{ marginRight: '0.5rem' }} className={styles['form-title']}>
          {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '-8px', alignItems: 'center' }}>
          <div style={{ scale: '86%', marginTop: '-2px' }}>
            <GoabButton
              type="secondary"
              testId="generate-template"
              size="compact"
              disabled={isButtonDisabled}
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
    </div>
  );
};
