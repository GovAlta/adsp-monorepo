import React, { useState } from 'react';

import { ReactComponent as SmallClose } from '@assets/icons/x.svg';
import { ReactComponent as InfoCircle } from '@assets/icons/info-circle.svg';
import { ReactComponent as TriangleRight } from '@assets/icons/triangleRight.svg';
import { ReactComponent as RectangleVertical } from '@assets/icons/rectangleVertical.svg';
import styled from 'styled-components';

export interface InfoCircleWithInlineHelpProps {
  text: string;
  width?: number | string;
  label?: string;
  initialLabelValue?: boolean;
}

export const InfoCircleWithInlineHelp = ({
  text,
  label,
  initialLabelValue = false,
  width = 320,
}: InfoCircleWithInlineHelpProps): JSX.Element => {
  const [viewSubmissionInclineHelp, setViewSubmissionInclineHelp] = useState<boolean>(false);

  const displayInfoCircle = (): JSX.Element => {
    if (label) {
      return (
        <>
          <DropDownLabelStyle>{label ? `${label}  ` : null}</DropDownLabelStyle>
          {initialLabelValue ? <InfoCircle /> : null}
        </>
      );
    }

    return <InfoCircle />;
  };
  return (
    <div
      className="info-circle"
      onClick={() => {
        setViewSubmissionInclineHelp(viewSubmissionInclineHelp ? false : true);
      }}
    >
      <InlinePadding>
        {displayInfoCircle()}
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
        <div>
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
        </div>
      </InlinePadding>
    </div>
  );
};

export const ViewBox = styled.div`
  position: fixed;
  margin-top: -50px;
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
  display: flex;
  flex-direction: row;
  align-items: center;

  .triangle {
    margin-top: -4px;
    margin-bottom: -14px;
    z-index: 10;
  }
  .rectangle {
    margin-left: -6px;
    margin-rop: -1px;
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

export const DropDownLabelStyle = styled.div`
  display: contents;
  font-weight: var(--goa-font-weight-bold);
  font-size: var(--goa-font-size-4);
`;
