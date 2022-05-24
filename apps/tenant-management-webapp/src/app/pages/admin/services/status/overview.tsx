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
        <>
          <h2>Guidelines for choosing a health check endpoint:</h2>
          <ol>
            <li>A Health check endpoint needs to be publicly accessible over the internet</li>
            <li>
              A Health check endpoint needs to return
              <ul>
                <li>A 200 level status code to indicate good health</li>
                <li>A non-200 level status code to indicate bad health.</li>
              </ul>
            </li>
            <li>
              To be most accurate, the health check endpoint should reference a URL that makes comprehensive use of your
              app, and checks connectivity to any databases, for instance.
            </li>
          </ol>
        </>
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
