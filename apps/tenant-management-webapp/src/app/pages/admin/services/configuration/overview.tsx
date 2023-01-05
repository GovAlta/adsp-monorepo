import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';

interface ConfigurationOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (number) => void;
  disabled?: boolean;
}
export const ConfigurationOverview: FunctionComponent<ConfigurationOverviewProps> = (props) => {
  const { setActiveEdit, setActiveIndex, disabled } = props;

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []);

  return (
    <div>
      <section>
        <p>
          The configuration service provides a generic json document store for storage and revisioning of infrequently
          changing configuration. Store configuration against namespace and name keys, and optionally define
          configuration schemas for write validation.
        </p>
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
