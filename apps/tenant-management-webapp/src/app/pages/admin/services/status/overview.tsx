import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { ContactInformation } from './contactInformation/contactInformation';
import { StatusMetrics } from './metrics';
import styled from 'styled-components';

interface StatusOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (number) => void;
  disabled?: boolean;
}

export const StatusOverview: FunctionComponent<StatusOverviewProps> = (props) => {
  const { setActiveEdit, setActiveIndex, disabled } = props;

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []);

  return (
    <OverviewCss>
      <section>
        This service allows for easy monitoring of application downtime.
        <p>
          Each application should represent a service that is useful to the end user by itself, such as child care
          subsidy and child care certification
        </p>
        <GoAButton
          data-testid="add-application"
          disabled={disabled}
          buttonType="primary"
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add application
        </GoAButton>
      </section>
      <ContactInformation />
      <StatusMetrics />
    </OverviewCss>
  );
};

const OverviewCss = styled.div`
  .contact-border {
    padding: 1rem;
    border: 1px solid #ccc;
  }

  .left-float {
    float: left;
  }
`;
