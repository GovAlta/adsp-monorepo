import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageLoader } from '@core-services/app-common';
import { RootState } from '../store/index';
import { useSelector } from 'react-redux';
import { CircularProgressVariant } from '@abgov/react-components';

interface IndicatorProps {
  delay?: number;
  message?: string;
  pageLock?: boolean;
  variant?: CircularProgressVariant;
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return showIndicator && <PageLoader message={message} variant={props.variant} />;
};

export const Center = styled.div`
  margin-top: 2em;
  display: flex;
  justify-content: center;
`;

export const useActionStateCheck = (actionName: string, stateToCheck = 'completed') => {
  const loadingState = useSelector((state: RootState) => {
    return state?.session?.loadingStates.find((state) => state.name === actionName);
  });

  if (loadingState === undefined) {
    return false;
  }

  return loadingState.state === stateToCheck;
};

export const PageIndicator = (variant): JSX.Element => {
  // Using redux in component shall be limited.
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const props = {
    ...indicator,
    pageLock: false,
    variant: variant.variant,
  };

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);
  return (
    indicator.show && (
      <Center>
        <IndicatorWithDelay {...props} />
      </Center>
    )
  );
};

export const TextLoadingIndicator = styled.span`
  animation: blinker 1s linear infinite;
  font-size: 14px;
  font-style: italic;
  @keyframes blinker {
    50% {
      opacity: 0;
    }
  }
`;
