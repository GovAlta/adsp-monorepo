import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { GoabIconButton } from '@abgov/react-components';

export const COPIED_DISPLAY_MS = 5000;

interface CopyLinkIconProps {
  label: string;
  link: string;
  testId: string;
}

const CopyLinkIconWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-2xs);

  h3 {
    margin: 0;
  }
`;

const CopyLinkIcon = ({ label, link, testId }: CopyLinkIconProps): JSX.Element => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), COPIED_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  const buttonLabel = isCopied ? `${label} copied` : `Copy ${label}`;

  return (
    <CopyLinkIconWrapper title={link}>
      <h3>{label}</h3>
      {/* title is the only prop goa-icon-button forwards to its inner role="img" icon; without it axe reports the icon as unnamed */}
      <GoabIconButton
        icon={isCopied ? 'checkmark' : 'copy'}
        size="small"
        testId={testId}
        title={buttonLabel}
        ariaLabel={buttonLabel}
        onClick={copyLink}
      />
    </CopyLinkIconWrapper>
  );
};

export default CopyLinkIcon;
