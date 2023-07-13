import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { PdfMetrics } from './metrics';
import { useDispatch } from 'react-redux';
import { fetchPdfMetrics } from '@store/pdf/action';
import { OverviewLayout } from '@components/Overview';
import { useHistory } from 'react-router-dom';

interface PdfOverviewProps {
  setOpenAddTemplate: (val: boolean) => void;
}

export const PdfOverview: FunctionComponent<PdfOverviewProps> = ({ setOpenAddTemplate }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    setOpenAddTemplate(false);
    dispatch(fetchPdfMetrics());
    history.push({
      pathname: '/admin/services/pdf',
    });
  }, []);

  const history = useHistory();
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
              history.push({
                pathname: '/admin/services/pdf',
                search: '?templates=true',
              });
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
