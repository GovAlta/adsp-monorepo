import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getConfigurationDefinitions } from '../../../../../store/configuration/action';
import { PageIndicator } from '@components/Indicator';
import { NameDiv } from '../styled-components';
import { renderNoItem } from '@components/NoItem';
import { ServiceTableComponent } from './definitionslist';

export const ConfigurationDefinitions: FunctionComponent = () => {
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
  const coreTenant = 'Platform';
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);
  return (
    <>
      {indicator.show && <PageIndicator />}
      {/* <div>
        {!indicator.show && !tenantConfigDefinitions && renderNoItem('configuration')}
        {!indicator.show && tenantConfigDefinitions && (
          <>
            <ServiceTableComponent definitions={tenantConfigDefinitions} />
          </>
        )}
      </div> */}
      <div>
        {!indicator.show && !coreConfigDefinitions && renderNoItem('configuration')}
        {!indicator.show && coreConfigDefinitions && (
          <>
            <ServiceTableComponent definitions={coreConfigDefinitions} />
          </>
        )}
      </div>
    </>
  );
};
