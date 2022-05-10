import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';

interface PdfOverviewProps {
  updateActiveIndex: (index: number) => void;
  setOpenAddTemplate: (val: boolean) => void;
}

export const PdfOverview: FunctionComponent<PdfOverviewProps> = ({ updateActiveIndex, setOpenAddTemplate }) => {
  useEffect(() => {
    updateActiveIndex(0);
    setOpenAddTemplate(false);
  }, []);
  return (
    <div>
      <p>
        The PDF service provides PDF operations like generating new PDFs from templates. It runs operations as
        asynchronous jobs and uploads the output PDF files to the file service.
      </p>
      <GoAButton
        data-testid="add-templates"
        onClick={() => {
          updateActiveIndex(1); // to switch to templates tab
          setOpenAddTemplate(true);
        }}
      >
        Add template
      </GoAButton>
    </div>
  );
};
