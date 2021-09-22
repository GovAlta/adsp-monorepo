import React, { useEffect } from 'react';
import { GoAPageLoader } from '@abgov/react-components';
import { useSelector } from 'react-redux'
import { RootState } from '@store/index';

export const PageLoader = (): JSX.Element => {
  const { isReady } = useSelector((state: RootState) => ({
    isReady: state.session.isLoadingReady,
  }));
  // eslint-disable-next-line
  useEffect(() => { }, [isReady]);
  return <GoAPageLoader visible={!isReady} message="Loading..." type="infinite" pagelock={false} />;
};