import React, { FunctionComponent, useEffect } from 'react';
import { GoabButton } from '@abgov/react-components';
import { OverviewLayout } from '@components/Overview';
import { useNavigate } from 'react-router-dom';

interface ConfigurationOverviewProps {
  setActiveEdit: (boolean) => void;
  disabled?: boolean;
}
export const ConfigurationOverview: FunctionComponent<ConfigurationOverviewProps> = (props) => {
  const { setActiveEdit, disabled } = props;
  const navigate = useNavigate();

  useEffect(() => {
    setActiveEdit(false);
    navigate('/admin/services/configuration');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const description = `The configuration service provides a generic json document store for storage and revisioning of infrequently changing configuration. Store configuration against namespace and name keys, and optionally define configuration schemas for write validation.`;

  return (
    <OverviewLayout
      testId="configuration-service-overview"
      description={description}
      addButton={
        <GoabButton
          testId="add-definition"
          disabled={disabled}
          onClick={() => {
            navigate('/admin/services/configuration?templates=true');
            setActiveEdit(true);
          }}
        >
          Add definition
        </GoabButton>
      }
    />
  );
};
