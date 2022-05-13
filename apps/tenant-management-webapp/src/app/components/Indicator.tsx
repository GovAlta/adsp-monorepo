import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';
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
  let pageLock = true;
  if (props?.pageLock === false) {
    pageLock = false;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIndicator(true);
    }, delayInMS);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return <>{showIndicator && <GoAPageLoader visible={true} type="infinite" message={message} pagelock={pageLock} />}</>;
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
  return (
    <>
      {indicator.show && (
        <Center>
          <IndicatorWithDelay {...props} />
        </Center>
      )}
    </>
  );
};
