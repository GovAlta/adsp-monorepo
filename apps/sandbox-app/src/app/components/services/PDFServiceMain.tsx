import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer } from '@abgov/react-components';

function PDFServiceMain() {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'pdfServiceContainer'}
        heading={'PDF Service'}
      >
        Testing
      </GoabContainer>
    </ServiceContainer>
  );
}

export default PDFServiceMain;
