import React from 'react';
import { GoabCircularProgress } from '@abgov/react-components';
import { CenterPageLoader, CenterPage } from './styled-components';
import { GoabCircularProgressSize, GoabCircularProgressVariant } from '@abgov/ui-components-common';
interface PageLoaderProps {
  message?: string;
  size?: GoabCircularProgressSize;
  variant?: GoabCircularProgressVariant;
}
export const PageLoader = (props: PageLoaderProps): JSX.Element => {
  const message = props.message || 'Loading...';
  const size = props.size || 'large';
  return (
    <CenterPageLoader>
      <GoabCircularProgress visible={true} message={message} size={size} variant={props.variant} />
    </CenterPageLoader>
  );
};

export const CenterWidthPageLoader = (props: PageLoaderProps): JSX.Element => {
  return (
    <CenterPage>
      <GoabCircularProgress visible={true} message="Loading ..." size="large" />
    </CenterPage>
  );
};
