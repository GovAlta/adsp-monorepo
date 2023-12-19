import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageLoader } from '@core-services/app-common';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

interface IndicatorProps {
  delay?: number;
  message?: string;
  pageLock?: boolean;
}
export const IndicatorWithDelay = (props: IndicatorProps): JSX.Element => {
  const [showIndicator, setShowIndicator] = useState<boolean>(false);
  const delayInMS = props.delay || 500;
  const message = props.message || 'Loading';

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIndicator(true);
    }, delayInMS);
    return () => {
      clearTimeout(timer);
    };
  }, []);
  //eslint-disable-next-line
  return <>{showIndicator && <PageLoader message={message} />}</>;
};

const Center = styled.div`
  margin-top: 2em;
  display: flex;
  justify-content: center;
`;

export const PageIndicator = (): JSX.Element => {
  // Using redux in component shall be limited.
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const props = {
    ...indicator,
    pageLock: false,
  };

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);
  return <Center>{indicator.show && <IndicatorWithDelay {...props} />}</Center>;
};
