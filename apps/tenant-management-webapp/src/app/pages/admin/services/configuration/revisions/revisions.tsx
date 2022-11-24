import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getConfigurationDefinitions, getConfigurationRevisions } from '@store/configuration/action';
import { GoADropdownOption, GoADropdown } from '@abgov/react-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { RevisionTable } from './revisionsTable';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';

export const ConfigurationRevisions = (): JSX.Element => {
  const { serviceList } = useSelector((state: RootState) => state.configuration);
  const dispatch = useDispatch();
  const [selectedConfiguration, setSelectedConfiguration] = useState('');
  const [showTable, setShowTable] = useState(false);
  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  return (
    <div>
      <GoAForm>
        <GoAFormItem>
          <label aria-label="select-configuration-label">Select definition</label>
          {indicator.show && <GoASkeletonGridColumnContent key={1} rows={1}></GoASkeletonGridColumnContent>}
          {serviceList?.length > 0 && (
            <GoADropdown
              name="Configurations"
              selectedValues={[selectedConfiguration]}
              onChange={(name: string, selectedConfiguration: string | string[]) => {
                setSelectedConfiguration(selectedConfiguration.toString());
                dispatch(getConfigurationRevisions(selectedConfiguration.toString()));
                setShowTable(true);
              }}
              aria-label="select-configuration-dropdown"
              multiSelect={false}
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
      </GoAForm>
      {showTable && <RevisionTable service={selectedConfiguration} />}
    </div>
  );
};
