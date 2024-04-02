import React, { useState, useEffect } from 'react';
import { CopyLinkToolTipClipboardWrapper, CopyLinkToolTipWrapper, LinkCopyComponentWrapper } from './styled-components';
import { ReactComponent as GreenCircleCheckMark } from '@icons/green-circle-checkmark.svg';
import { GoAButton } from '@abgov/react-components-new';

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
          <div className="checkmark-icon">
            <GreenCircleCheckMark />
          </div>
          <div className="message-clipboard">
            <p>Link copied to clipboard </p>
          </div>
        </CopyLinkToolTipClipboardWrapper>
      )}

      {!isCopied && isShowURL && (
        <CopyLinkToolTipWrapper>
          <p className="url-tooltip message">{link}</p>
        </CopyLinkToolTipWrapper>
      )}
      <GoAButton
        type="secondary"
        leadingIcon="link"
        testId="copy-link-button"
        onClick={() => {
          navigator.clipboard.writeText(link);
          setIsCopied(true);
        }}
      >
        {text}
      </GoAButton>
    </LinkCopyComponentWrapper>
  );
};

export default LinkCopyComponent;
