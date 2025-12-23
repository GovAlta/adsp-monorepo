import { GoabSpinner } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import styled from 'styled-components';

interface LoadingIndicatorProps {
  className?: string;
  isLoading: boolean;
}

const LoadingIndicatorComponent: FunctionComponent<LoadingIndicatorProps> = ({ className, isLoading }) => {
  return (
    <div className={className} data-loading={isLoading}>
      <GoabSpinner size="large" type="infinite" />
    </div>
  );
};

export const LoadingIndicator = styled(LoadingIndicatorComponent)`
  display: none;
  z-index: 1;
  position: absolute;
  background: white;
  opacity: 0.7;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  > * {
    margin: auto;
  }

  &[data-loading='true'] {
    display: flex;
  }
`;
