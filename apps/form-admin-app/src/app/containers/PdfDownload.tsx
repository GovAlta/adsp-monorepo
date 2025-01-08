import { GoAButton, GoAFormItem } from '@abgov/react-components-new';
import { FunctionComponent, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, AppState, downloadFile, pdfSelector } from '../state';
import { GoAEnumCheckboxGroupControl } from '@abgov/jsonforms-components';

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
      <GoAFormItem label="Download PDF copy">
        <GoAButton type="tertiary" size="compact" trailingIcon="download" onClick={onDownload}>
          {pdf.filename}
        </GoAButton>
      </GoAFormItem>
    )
  );
};
