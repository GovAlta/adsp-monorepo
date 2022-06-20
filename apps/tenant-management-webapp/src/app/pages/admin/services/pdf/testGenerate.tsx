import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GeneratePDFModal } from './generatePDFModal';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, generatePdf, streamPdfSocket } from '@store/pdf/action';
import { RootState } from '@store/index';
import { GoAPageLoader } from '@abgov/react-components';

import FileList from './fileList';
import styled from 'styled-components';

const PdfProcessing = styled.div`
  min-height: 185px;
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  padding: 16px;
  margin-bottom: 1rem;

  .progress-container--large {
    background: #f3f3f3;
  }
`;

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

  const queuedCount = stream.filter((s) => s.name === 'pdf-generation-queued').length;
  const queuedComplete = stream.filter((s) => s.name === 'pdf-generated' || s.name === 'pdf-generation-failed').length;
  console.log(queuedCount);
  console.log(queuedComplete);
  const currentlyLoading = queuedCount !== queuedComplete;

  return (
    <GeneratorStyling>
      <section>
        <div className="button-margin">
          <GoAButton
            data-testid="add-templates"
            onClick={() => {
              setShowGenerateWindow(true);
            }}
          >
            Generate PDF
          </GoAButton>
        </div>

        <PdfProcessing>
          <div className="row-flex">
            <div className="indicator">
              {(indicator.show || currentlyLoading) && (
                <div className="extra-padding">
                  <GoAPageLoader visible={true} message="" type="infinite" pagelock={false} />
                </div>
              )}
            </div>
            <div className="event-stream">
              {stream.map((streamItem, index) => {
                const currentTime = new Date(streamItem?.timestamp);
                const paddedTime = (time) => time.toString().padStart(2, '0');
                return (
                  <div key={index}>
                    [{paddedTime(currentTime.getHours())}:{paddedTime(currentTime.getMinutes())}:
                    {paddedTime(currentTime.getSeconds())}]: {streamItem?.payload?.templateId}: {streamItem.namespace}:
                    {streamItem.name}
                  </div>
                );
              })}
            </div>
          </div>
        </PdfProcessing>

        <FileList />
        {showGeneratorWindow && (
          <GeneratePDFModal
            open={showGeneratorWindow}
            onSave={(definition) => {
              dispatch(generatePdf(definition));
              setShowGenerateWindow(false);
            }}
            onClose={() => {
              dispatch(streamPdfSocket(true, null));
              setShowGenerateWindow(false);
            }}
          />
        )}
      </section>
    </GeneratorStyling>
  );
};
