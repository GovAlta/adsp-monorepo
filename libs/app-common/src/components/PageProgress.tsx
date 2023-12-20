import { GoACircularProgress, CircularProgressSize } from '@abgov/react-components-new';
import { CenterPageLoader, CenterPage } from './styled-components';
import React from 'react';
interface PageLoaderProps {
  message?: string;
  size?: CircularProgressSize;
}
export const PageLoader = (props: PageLoaderProps): JSX.Element => {
  const message = props.message || 'Loading...';
  const size = props.size || 'large';
  return (
    <CenterPageLoader>
      <GoACircularProgress visible={true} message={message} size={size} />
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
