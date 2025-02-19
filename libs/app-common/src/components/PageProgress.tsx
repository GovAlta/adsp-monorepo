import React from 'react';
import { GoACircularProgress, CircularProgressSize, CircularProgressVariant } from '@abgov/react-components';
import { CenterPageLoader, CenterPage } from './styled-components';

interface PageLoaderProps {
  message?: string;
  size?: CircularProgressSize;
  variant?: CircularProgressVariant;
}
export const PageLoader = (props: PageLoaderProps): JSX.Element => {
  const message = props.message || 'Loading...';
  const size = props.size || 'large';
  return (
    <CenterPageLoader>
      <GoACircularProgress visible={true} message={message} size={size} variant={props.variant} />
    </CenterPageLoader>
  );
};

export const CenterWidthPageLoader = (props: PageLoaderProps): JSX.Element => {
  return (
    <CenterPage>
      <GoACircularProgress visible={true} message="Loading ..." size="large" />
    </CenterPage>
  );
};
