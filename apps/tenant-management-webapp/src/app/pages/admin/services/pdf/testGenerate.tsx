import React, { FunctionComponent, useEffect } from 'react';
import { GeneratePDF } from './generatePDFModal';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, generatePdf, streamPdfSocket } from '@store/pdf/action';
import { RootState } from '@store/index';

import JobList from './jobList';
import styled from 'styled-components';

const GeneratorStyling = styled.div`
  .extra-padding {
    margin: 20px 0 0 0;
  }

  .topBottomPadding {
    padding: 15px 0;
  }

  .row-flex {
    display: flex;
    flex-direction: row;
  }

  .indicator {
    background: #f3f3f3;
    min-width: 160px;
  }

  .event-stream {
    flex: 3;
    fontsize: 12px;
  }

  .button-margin {
    margin: 0 0 20px 0;
  }
`;

export const TestGenerate: FunctionComponent = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getPdfTemplates());
  }, []);

  const socketChannel = useSelector((state: RootState) => {
    return state?.pdf.socketChannel;
  });

  useEffect(() => {
    if (!socketChannel || socketChannel.connected === false) dispatch(streamPdfSocket(false));
  }, [socketChannel]);

  return (
    <GeneratorStyling>
      <h1>Test Generate</h1>
      <p>
        Here you can test generating new PDFs from templates. Operations are run as asynchronous jobs and the PDF files
        output to the file service.
      </p>

      <GeneratePDF
        onSave={(definition) => {
          dispatch(generatePdf(definition));
        }}
      />
      <section>
        <JobList />
      </section>
    </GeneratorStyling>
  );
};
