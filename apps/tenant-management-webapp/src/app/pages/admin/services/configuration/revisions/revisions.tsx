import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getConfigurationDefinitions, getConfigurationRevisions } from '@store/configuration/action';
import { GoADropdownItem, GoADropdown, GoAFormItem, GoASkeleton } from '@abgov/react-components-new';
import { RevisionTable } from './revisionsTable';

export const ConfigurationRevisions = (): JSX.Element => {
  const { serviceList } = useSelector((state: RootState) => state.configuration);
  const dispatch = useDispatch();
  const [selectedConfiguration, setSelectedConfiguration] = useState('');
  const [showTable, setShowTable] = useState(false);
  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, [dispatch]);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  return (
    <div>
      <GoAFormItem label="Select definition">
        {indicator.show && serviceList?.length === 0 && <GoASkeleton type="text" key={1}></GoASkeleton>}
        {serviceList?.length > 0 && (
          <GoADropdown
            name="Configurations"
            value={selectedConfiguration}
            onChange={(name: string, selectedConfiguration: string | string[]) => {
              setSelectedConfiguration(selectedConfiguration.toString());
              dispatch(getConfigurationRevisions(selectedConfiguration.toString()));
              setShowTable(true);
            }}
            aria-label="select-configuration-dropdown"
            width="100%"
            testId="configuration-select-definition-dropdown"
          >
            {serviceList.map((item) => (
              <GoADropdownItem
                name="Configurations"
                key={item}
                label={item}
                value={item}
                testId={`${item}-get-configuration-options`}
              />
            ))}
          </GoADropdown>
        )}
      </GoAFormItem>

      {showTable && <RevisionTable service={selectedConfiguration} />}
    </div>
  );
};
