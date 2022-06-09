import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GeneratePDFModal } from './generatePDFModal';
import { useDispatch, useSelector } from 'react-redux';
import { getPdfTemplates, generatePdf } from '@store/pdf/action';
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
  .extraPadding {
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
    flex: 1;
    background: #f3f3f3;
  }

  .event-stream {
    flex: 3;
    fontsize: 12px;
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

  const currentlyLoading = stream[stream.length - 1]?.name === 'pdf-generation-queued';

  return (
    <div>
      <section>
        <GeneratorStyling>
          <PdfProcessing>
            <div className="row-flex">
              <div className="indicator">
                {!indicator.show && !currentlyLoading && (
                  <GoAButton
                    data-testid="add-templates"
                    disabled={indicator.show || currentlyLoading}
                    onClick={() => {
                      setShowGenerateWindow(true);
                    }}
                  >
                    Generate PDF
                  </GoAButton>
                )}
                {currentlyLoading && (
                  <div className="extraPadding">
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
                      {paddedTime(currentTime.getSeconds())}]: {streamItem?.payload?.templateId}: {streamItem.namespace}
                      :{streamItem.name}
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
                setShowGenerateWindow(false);
              }}
            />
          )}
        </GeneratorStyling>
      </section>
    </div>
  );
};
