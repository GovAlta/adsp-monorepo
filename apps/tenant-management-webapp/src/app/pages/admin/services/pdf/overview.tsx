import React, { FunctionComponent, useEffect } from 'react';
import { GoabButton } from '@abgov/react-components';
import { PdfMetrics } from './metrics';
import { useDispatch } from 'react-redux';
import { fetchPdfMetrics } from '@store/pdf/action';
import { OverviewLayout } from '@components/Overview';
import { useNavigate } from 'react-router-dom';

interface PdfOverviewProps {
  setOpenAddTemplate: (val: boolean) => void;
}

export const PdfOverview: FunctionComponent<PdfOverviewProps> = ({ setOpenAddTemplate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    setOpenAddTemplate(false);
    dispatch(fetchPdfMetrics());
    navigate('/admin/services/pdf');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const description =
    'The PDF service provides PDF operations like generating new PDFs from templates. It runs operations as asynchronous jobs and uploads the output PDF files to the file service.';
  return (
    <OverviewLayout
      testId="pdf-service-overview"
      description={description}
      addButton={
        <GoabButton
          testId="add-templates"
          onClick={() => {
            navigate('/admin/services/pdf?templates=true');
            setOpenAddTemplate(true);
          }}
        >
          Add template
        </GoabButton>
      }
      extra={<PdfMetrics />}
    />
  );
};
