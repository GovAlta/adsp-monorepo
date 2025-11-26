import React from 'react';
import { BackButtonWrapper } from './styled-components';

export interface BackButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, children = 'Back' }) => {
  return (
    <BackButtonWrapper onClick={onClick} type="button">
      <svg viewBox="0 0 24 24">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
      </svg>
      {children}
    </BackButtonWrapper>
  );
};
