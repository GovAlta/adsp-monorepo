import React, { useState } from 'react';

import { ReactComponent as SmallClose } from '@assets/icons/x.svg';
import { ReactComponent as InfoCircle } from '@assets/icons/info-circle.svg';
import { ReactComponent as TriangleRight } from '@assets/icons/triangleRight.svg';
import { ReactComponent as RectangleVertical } from '@assets/icons/rectangleVertical.svg';
import styled from 'styled-components';

export interface InfoCircleWithInlineHelpForFileProps {
  text: string;
  width?: number | string;
}

export const InfoCircleWithInlineHelpForFile = ({
  text,
  width = 320,
}: InfoCircleWithInlineHelpForFileProps): JSX.Element => {
  const [viewSubmissionInclineHelp, setViewSubmissionInclineHelp] = useState<boolean>(false);

  return (
    <InlineBlockDiv
      onClick={() => {
        setViewSubmissionInclineHelp(viewSubmissionInclineHelp ? false : true);
      }}
    >
      <InlinePadding>
        <InfoCircle />
        <div className="triangle-width">
          {viewSubmissionInclineHelp && (
            <div className="bubble-helper">
              <div className="triangle">
                <TriangleRight />
              </div>
              <div className="rectangle">
                <RectangleVertical />
              </div>
            </div>
          )}
        </div>

        {viewSubmissionInclineHelp && (
          <ViewBox>
            <div className="overflow-wrap bubble-border" style={{ width: `${width}px` }}>
              <div className="small-text">{text}</div>
              <div
                className="small-close-button"
                onClick={() => {
                  setViewSubmissionInclineHelp(false);
                }}
              >
                <SmallClose />
              </div>
            </div>
          </ViewBox>
        )}
      </InlinePadding>
    </InlineBlockDiv>
  );
};

export const ViewBox = styled.div`
  position: relative;
  margin-top: -65px;
  margin-left: 40px;
  z-index: 1000;

  .small-text {
    font-size: 14px;
    line-height: 19px;
  }

  .bubble-border {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 10px 12px 8px 12px;
    margin-right: 10px;
    gap: 8px;

    width: 322px;
    height: 100%;
    left: 0px;

    z-index: 3;

    background: #ffffff;
    background-color: #ffffff;
    box-shadow: 0px -1px 6px rgba(0, 0, 0, 0.25);
    border-radius: 4px;
  }

  .overflow-wrap {
    overflow-wrap: anywhere;
  }

  .small-close-button {
    width: 10px;
    margin-left: auto;
    margin-top: -10px;
  }
`;

export const InlinePadding = styled.div`
  flex-direction: row;
  align-items: center;

  .triangle {
    margin-top: -25px;
    margin-left: 15px;
    margin-bottom: -14px;
    z-index: 10;
  }
  .rectangle {
    margin-left: -6px;
    margin-top: -11px;
    z-index: 12;
  }
  .bubble-helper {
    margin-bottom: -11px;
    display: flex;
    flex-direction: row;
  }
  .triangle-width {
    width: 25px;
  }
`;

export const InlineBlockDiv = styled.div`
  display: inline-block;
  position: absolute;
  margin-top: 11px;
`;
