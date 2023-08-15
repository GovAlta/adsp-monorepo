import React, { useState, useEffect } from 'react';
import { CopyLinkToolTipClipboardWrapper, CopyLinkToolTipWrapper, LinkCopyComponentWrapper } from './styled-components';
import { ReactComponent as GreenCircleCheckMark } from '@icons/green-circle-checkmark.svg';
import { GoAButton as GoAButtonV2 } from '@abgov/react-components-new';

interface LinkCopyComponentProps {
  link: string;
  text: string;
}

const LinkCopyComponent = ({ link, text }: LinkCopyComponentProps): JSX.Element => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isShowURL, setIsShowURL] = useState<boolean>(false);

  useEffect(() => {
    let tooltipTimer;
    if (isCopied === true) {
      tooltipTimer = setTimeout(() => {
        setIsCopied(false);
      }, 8 * 1000);
    }
    return () => {
      if (tooltipTimer !== null || tooltipTimer === undefined) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [isCopied]);

  return (
    <LinkCopyComponentWrapper
      onMouseEnter={() => {
        setIsShowURL(true);
      }}
      onMouseLeave={() => {
        setIsShowURL(false);
      }}
    >
      {isCopied && (
        <CopyLinkToolTipClipboardWrapper>
          <p>
            <div className="checkmark-icon">
              <GreenCircleCheckMark />
            </div>
            <div className="message-clipboard">Link copied to clipboard</div>
          </p>
        </CopyLinkToolTipClipboardWrapper>
      )}

      {!isCopied && isShowURL && (
        <CopyLinkToolTipWrapper>
          <p className="url-tooltip">
            <div className="message">{link}</div>
          </p>
        </CopyLinkToolTipWrapper>
      )}
      <GoAButtonV2
        type="secondary"
        leadingIcon="link"
        testId="copy-link-button"
        onClick={() => {
          navigator.clipboard.writeText(link);
          setIsCopied(true);
        }}
      >
        {text}
      </GoAButtonV2>
    </LinkCopyComponentWrapper>
  );
};

export default LinkCopyComponent;
