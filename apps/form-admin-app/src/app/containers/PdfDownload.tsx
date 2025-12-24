import { GoabButton, GoabFormItem } from '@abgov/react-components';
import { FunctionComponent, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, AppState, downloadFile, pdfSelector } from '../state';

interface PdfDownloadProps {
  urn: string;
}

export const PdfDownload: FunctionComponent<PdfDownloadProps> = ({ urn }) => {
  const dispatch = useDispatch<AppDispatch>();

  const pdf = useSelector((state: AppState) => pdfSelector(state, urn));
  const onDownload = useCallback(async () => {
    const { file: dataUrl, metadata } = await dispatch(downloadFile(pdf?.urn)).unwrap();
    const anchor = document.createElement('a');
    anchor.download = metadata.filename;
    anchor.href = dataUrl;
    anchor.click();
  }, [dispatch, pdf]);

  return (
    pdf && (
      <GoabFormItem label="Download PDF copy">
        <GoabButton type="tertiary" size="compact" trailingIcon="download" onClick={onDownload}>
          {pdf.filename}
        </GoabButton>
      </GoabFormItem>
    )
  );
};
