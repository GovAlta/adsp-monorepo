import React, { useEffect } from 'react';

import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { GoACircularProgress } from '@abgov/react-components';

export const PageLoader = (): JSX.Element => {
  const { isReady } = useSelector((state: RootState) => ({
    isReady: state.session.isLoadingReady,
  }));
  // eslint-disable-next-line
  useEffect(() => {}, [isReady]);
  return <GoACircularProgress visible={!isReady} message="Loading..." size="large" />;
};
