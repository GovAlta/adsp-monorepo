import React, { FunctionComponent } from 'react';
import { GoAButton } from '@abgov/react-components';

interface ConfigurationOverviewProps {
  setActiveEdit?: (boolean) => void;
  disabled?: boolean;
}
export const ConfigurationOverview: FunctionComponent<ConfigurationOverviewProps> = (props) => {
  const { setActiveEdit, disabled } = props;

  return (
    <div>
      <section>
        <p>
          The configuration service provides a generic json document store for storage and revisioning of infrequently
          changing configuration. Store configuration against namespace and name keys, and optionally define
          configuration schemas for write validation.
        </p>
        <br />
        <GoAButton
          data-testid="add-definition"
          disabled={disabled}
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add definition
        </GoAButton>
      </section>
    </div>
  );
};
