import React from 'react';
import { GoAButton } from '@abgov/react-components-new';
import styled from 'styled-components';

interface TabletMesssageProps {
  goBack(): void;
}

export const TabletMessage = ({ goBack }: TabletMesssageProps) => {
  return (
    <TabletMessageContainer>
      <h1>This editor requires your device to be at least 1440 pixels wide and 630 pixels high</h1>
      <h3>Please rotate your device</h3>
      <h3>For the best experience, please use a Desktop</h3>
      <GoAButton
        onClick={() => {
          goBack();
        }}
        testId="back-to-previous"
        type="tertiary"
      >
        Go back
      </GoAButton>
    </TabletMessageContainer>
  );
};

const TabletMessageContainer = styled.div`
  h1,
  h3 {
    text-align: center;
    margin: 40px;
  }

  text-align: center !important;

  @media (min-height: 630px) {
    @media (min-width: 1440px) {
      display: none;
    }
  }
`;
