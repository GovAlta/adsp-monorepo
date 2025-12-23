import React from 'react';
import { GoabCircularProgress } from '@abgov/react-components';
import styled from 'styled-components';

// eslint-disable-next-line
export const CustomLoader = (): JSX.Element => {
  return (
    <CustomLoaderWrapper>
      <GoabCircularProgress size="small" visible={true} />
    </CustomLoaderWrapper>
  );
};

const CustomLoaderWrapper = styled.div`
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  background-color: rgb(255 255 255 / 50%);
  display: block;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
`;
