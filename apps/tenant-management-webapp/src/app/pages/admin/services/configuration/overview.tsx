import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components-new';
import { OverviewLayout } from '@components/Overview';

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
  }, []);// eslint-disable-line react-hooks/exhaustive-deps
  const description = `The configuration service provides a generic json document store for storage and revisioning of infrequently changing configuration. Store configuration against namespace and name keys, and optionally define configuration schemas for write validation.`;

  return (
    <OverviewLayout
      description={description}
      addButton={
        <GoAButton
          testId="add-definition"
          disabled={disabled}
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add definition
        </GoAButton>
      }
    />
  );
};
