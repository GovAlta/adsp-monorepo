import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabButton, GoabButtonGroup, GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { useNavigate } from 'react-router-dom';

export const FormServiceMain = ({ tenantName }: ServiceMainProps) => {
  const navigate = useNavigate();
  const jsonformsExampleUrl = `/${tenantName}/services/jsonforms/example1/control-examples`;

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'formServiceContainer'}
        heading={'Form service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Form service.
        </GoabText>
        <GoabButtonGroup alignment="start" mt="m">
          <GoabButton
            type="secondary"
            testId="jsonforms-ds1-test"
            onClick={() => navigate(`${jsonformsExampleUrl}?designSystemsVersion=1.0`)}
          >
            Test JSONForms DS1
          </GoabButton>
          <GoabButton
            type="primary"
            testId="jsonforms-ds2-test"
            onClick={() => navigate(`${jsonformsExampleUrl}?designSystemsVersion=2.0`)}
          >
            Test JSONForms DS2
          </GoabButton>
        </GoabButtonGroup>
      </GoabContainer>
    </ServiceContainer>
  );
};
