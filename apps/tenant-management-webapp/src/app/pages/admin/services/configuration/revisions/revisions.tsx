import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getConfigurationDefinitions, getConfigurationRevisions } from '@store/configuration/action';
import { GoADropdownOption, GoADropdown } from '@abgov/react-components-new';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { RevisionTable } from './revisionsTable';
export const ConfigurationRevisions = (): JSX.Element => {
  const { serviceList } = useSelector((state: RootState) => state.configuration);
  const dispatch = useDispatch();
  const [selectedConfiguration, setSelectedConfiguration] = useState('');
  const [showTable, setShowTable] = useState(false);
  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);

  return (
    <div>
      <GoAForm>
        <GoAFormItem>
          <label aria-label="select-configuration-label">Select definition</label>
          {serviceList?.length > 0 && (
            <GoADropdown
              name="Configurations"
              value={selectedConfiguration}
              onChange={(name, values) => {
                setSelectedConfiguration(values.toString());
                dispatch(getConfigurationRevisions(values.toString()));
                setShowTable(true);
              }}
              aria-label="select-configuration-dropdown"
            >
              {serviceList.map((item) => (
                <GoADropdownOption
                  name="Configurations"
                  label={item}
                  value={item}
                  data-testid={`${item}-get-configuration-options`}
                />
              ))}
            </GoADropdown>
          )}
        </GoAFormItem>
      </GoAForm>
      {showTable && <RevisionTable service={selectedConfiguration} />}
    </div>
  );
};
