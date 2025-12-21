import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageLoader } from '@core-services/app-common';

import { AppState } from '..';
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

  return showIndicator ? <PageLoader message={message} variant={props.variant} /> : <></>;
};

export const Center = styled.div`
  margin-top: 2em;
  display: flex;
  justify-content: center;
`;


interface PdfPageIndicatorProps {
  variant?: CircularProgressVariant;
}

export const PdfPageIndicator = (variant?: PdfPageIndicatorProps): JSX.Element | null => {
  // Using redux in component shall be limited.
  const indicator: boolean = useSelector((state: AppState) => {
    return state?.pdf.busy.loading;
  });

  const props: IndicatorProps = {
    pageLock: false,
    variant: variant?.variant,
  };

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);
  return indicator ? (
    <Center>
      <IndicatorWithDelay {...props} />
    </Center>
  ) : null;
};
