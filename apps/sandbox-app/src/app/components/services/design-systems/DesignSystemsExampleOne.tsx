import React, { useState } from 'react';
import { ServiceContainer } from '../../styled-components';
import { GoabButton, GoabContainer, GoabDrawer, GoabText } from '@abgov/react-components';

export const DesignSystemsExampleOne = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'design-systems-exampleOneContainer'}
        heading={'Design systems example one'}
        mb="none"
      >
        <GoabText mt="none" size="heading-m">
          Drawer example
        </GoabText>
        <GoabButton onClick={() => setIsOpen(true)}>Open drawer</GoabButton>
        <GoabDrawer heading="Application details" position="right" open={isOpen} onClose={handleClose}>
          <p>Use a drawer to display supplementary content or actions without navigating away from the current page.</p>
          <p>Drawers are useful for:</p>
          <ul>
            <li>Viewing detailed information about a selected item</li>
            <li>Editing settings or preferences</li>
            <li>Completing a quick task related to the main content</li>
          </ul>
        </GoabDrawer>
      </GoabContainer>
    </ServiceContainer>
  );
};
