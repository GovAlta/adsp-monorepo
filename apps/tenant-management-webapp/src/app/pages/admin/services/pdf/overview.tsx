import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { PdfMetrics } from './metrics';
import { useDispatch } from 'react-redux';
import { fetchPdfMetrics } from '@store/pdf/action';
import { OverviewLayout } from '@components/Overview';

interface PdfOverviewProps {
  updateActiveIndex: (index: number) => void;
  setOpenAddTemplate: (val: boolean) => void;
}

export const PdfOverview: FunctionComponent<PdfOverviewProps> = ({ updateActiveIndex, setOpenAddTemplate }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    updateActiveIndex(0);
    setOpenAddTemplate(false);
    dispatch(fetchPdfMetrics());
  }, []);
  const description =
    'The PDF service provides PDF operations like generating new PDFs from templates. It runs operations as asynchronous jobs and uploads the output PDF files to the file service.';
  return (
    <OverviewLayout
      testId="pdf-service-overview"
      description={description}
      addButton={
        <>
          <GoAButton
            data-testid="add-templates"
            onClick={() => {
              updateActiveIndex(1); // to switch to templates tab
              setOpenAddTemplate(true);
            }}
          >
            Add template
          </GoAButton>
        </>
      }
      extra={<PdfMetrics />}
    />
  );
};
