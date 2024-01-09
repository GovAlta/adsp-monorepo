import React, { useState } from 'react';

import { ReactComponent as SmallClose } from '@assets/icons/x.svg';
import { ReactComponent as InfoCircle } from '@assets/icons/info-circle.svg';
import { ReactComponent as TriangleLeft } from '@assets/icons/TriangleLeft.svg';
import { ReactComponent as TriangleRight } from '@assets/icons/TriangleRight.svg';
import { ReactComponent as RectangleVertical } from '@assets/icons/rectangleVertical.svg';
import styled from 'styled-components';

export interface InfoCircleWithInlineHelpProps {
  text: string;
  faceLeft?: boolean;
  width?: number;
}

export const InfoCircleWithInlineHelp = ({
  text,
  faceLeft,
  width = 320,
}: InfoCircleWithInlineHelpProps): JSX.Element => {
  const [viewSubmissionInclineHelp, setViewSubmissionInclineHelp] = useState<boolean>(false);
  console.log(JSON.stringify(faceLeft) + '<faceleft');
  return (
    <div
      className="info-circle"
      onClick={() => {
        setViewSubmissionInclineHelp(viewSubmissionInclineHelp ? false : true);
      }}
    >
      <InlinePadding style={{ flexDirection: faceLeft ? 'row-reverse' : 'row' }}>
        <InfoCirclePadding>
          <InfoCircle />
        </InfoCirclePadding>
        <div className="triangle-width">
          {viewSubmissionInclineHelp && (
            <div className="bubble-helper">
              <div className="triangle">{faceLeft ? <TriangleLeft /> : <TriangleRight />}</div>
              <div style={{ marginLeft: '-6px', marginTop: '-1px', zIndex: 100000 }}>
                <RectangleVertical />
              </div>
            </div>
          )}
        </div>
        <div>
          {viewSubmissionInclineHelp && (
            <ViewBox style={{ marginLeft: faceLeft ? '-440px' : '0' }}>
              <div className="overflow-wrap bubble-border" style={{ width: `${width}px` }}>
                <div style={{ fontSize: '14px', lineHeight: '19px' }}>{text}</div>
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
        </div>
      </InlinePadding>
    </div>
  );
};

export const ViewBox = styled.div`
  position: fixed;
  margin-top: -50px;

  z-index: 2000;
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
    top: 12px;

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
  position: fixed;
  display: flex;
  flex-direction: row;
  align-items: center;

  .triangle {
    margin-top: -4px;
    margin-bottom: -14px;
    z-index: 10000;
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

export const InfoCirclePadding = styled.div`
  margin-top: 8px;
`;
