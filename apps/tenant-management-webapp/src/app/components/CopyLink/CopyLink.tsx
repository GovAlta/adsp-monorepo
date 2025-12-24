import React, { useState, useEffect } from 'react';
import { CopyLinkToolTipClipboardWrapper, CopyLinkToolTipWrapper, LinkCopyComponentWrapper } from './styled-components';
import { ReactComponent as GreenCircleCheckMark } from '@icons/green-circle-checkmark.svg';
import { GoabButton } from '@abgov/react-components';

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

  useEffect(() => {
    const goaButton = document.querySelector("[testId='copy-link-button']");

    if (goaButton) {
      setTimeout(() => {
        const shadowRoot = goaButton?.shadowRoot;
        const icon = shadowRoot?.querySelector("[id='leading-icon']");
        if (icon) {
          icon.setAttribute('aria-hidden', 'true');
        }
      }, 500);
    }
  }, []);

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
            <div className="message-clipboard">Link copied to clipboard </div>
          </p>
        </CopyLinkToolTipClipboardWrapper>
      )}

      {!isCopied && isShowURL && (
        <CopyLinkToolTipWrapper>
          <p className="url-tooltip message">{link}</p>
        </CopyLinkToolTipWrapper>
      )}
      <GoabButton
        type="secondary"
        leadingIcon="link"
        testId="copy-link-button"
        aria-label="Copy Link"
        onClick={() => {
          navigator.clipboard.writeText(link);
          setIsCopied(true);
        }}
      >
        {text}
      </GoabButton>
    </LinkCopyComponentWrapper>
  );
};

export default LinkCopyComponent;
