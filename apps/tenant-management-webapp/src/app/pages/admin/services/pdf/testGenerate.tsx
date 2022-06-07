import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GeneratePDFModal } from './generatePDFModal';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, generatePdf } from '@store/pdf/action';
import { RootState } from '@store/index';
import { PageIndicator } from '@components/Indicator';
import FileList from './fileList';
import styled from 'styled-components';

interface PdfOverviewProps {
  updateActiveIndex: (index: number) => void;
  setOpenAddTemplate: (val: boolean) => void;
}

const PdfProcessing = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  padding: 16px;
  margin-bottom: 1rem;
`;

export const TestGenerate: FunctionComponent = () => {
  const dispatch = useDispatch();
  const [showGeneratorWindow, setShowGenerateWindow] = useState<boolean>(false);
  useEffect(() => {
    dispatch(getPdfTemplates());
  }, []);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const stream = useSelector((state: RootState) => {
    return state?.pdf.stream;
  });

  const tenant = useSelector((state: RootState) => {
    return state?.tenant;
  });

  return (
    <div>
      <section>
        <p>
          The PDF service provides PDF operations like generating new PDFs from templates. It runs operations as
          asynchronous jobs and uploads the output PDF files to the file service.
        </p>
        {JSON.stringify(tenant)}
        <h3>PDF Generation Feedback</h3>
        <PdfProcessing> {JSON.stringify(stream, null, 2)}</PdfProcessing>
        {indicator.show ? (
          <PageIndicator />
        ) : (
          <>
            <GoAButton
              data-testid="add-templates"
              onClick={() => {
                setShowGenerateWindow(true);
              }}
            >
              Generate PDF
            </GoAButton>
            <FileList />
          </>
        )}
        {showGeneratorWindow && (
          <GeneratePDFModal
            open={showGeneratorWindow}
            onSave={(definition) => {
              dispatch(generatePdf(definition));
              setShowGenerateWindow(false);
            }}
            onClose={() => {
              setShowGenerateWindow(false);
            }}
          />
        )}
      </section>
    </div>
  );
};
