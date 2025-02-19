import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { OverviewLayout } from '@components/Overview';

interface ValueOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (number) => void;
  disabled?: boolean;
}
export const ValueOverview: FunctionComponent<ValueOverviewProps> = (props) => {
  const { setActiveEdit, setActiveIndex, disabled } = props;

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const description = `The value service provides an append-only data store for time-series data, and supports storing json
            documents as values. Configure optional value definitions to specify the json schema for value writes.`;

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
