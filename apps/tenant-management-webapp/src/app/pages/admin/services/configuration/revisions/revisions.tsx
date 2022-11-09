import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getConfigurationDefinitions, getConfigurationRevisions } from '@store/configuration/action';
import { GoAButton } from '@abgov/react-components-new';
import { GoADropdownOption, GoADropdown } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAFormActions } from '@abgov/react-components/experimental';
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
          <label aria-label="select-configuration-label">Select configuration</label>
          {serviceList?.length > 0 && (
            <GoADropdown
              name="Configurations"
              selectedValues={[selectedConfiguration]}
              onChange={(name, values) => {
                setSelectedConfiguration(values[0]);
              }}
              aria-label="select-configuration-dropdown"
            >
              {serviceList.map((item) => (
                <GoADropdownOption
                  key={item}
                  label={item}
                  value={item}
                  data-testid={`${item}-get-configuration-options`}
                />
              ))}
            </GoADropdown>
          )}
        </GoAFormItem>
        <GoAFormActions alignment="right">
          {serviceList?.length > 0 && (
            <GoAButton
              onClick={() => {
                dispatch(getConfigurationRevisions(selectedConfiguration));
                setShowTable(true);
              }}
              disabled={selectedConfiguration === ''}
            >
              Show revisions
            </GoAButton>
          )}
        </GoAFormActions>
      </GoAForm>
      {showTable && <RevisionTable service={selectedConfiguration} />}
    </div>
  );
};
