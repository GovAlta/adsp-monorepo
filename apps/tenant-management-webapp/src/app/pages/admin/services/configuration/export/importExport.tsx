import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { RootState } from '@store/index';
import { toService, toSchemaMap, toNamespaceMap, toDownloadFormat } from './ServiceConfiguration';
import { GoAButton, GoACheckbox } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getConfigurationDefinitions, getConfiguration, clearConfigurationAction } from '@store/configuration/action';
import { PageIndicator } from '@components/Indicator';
import { ConfigurationExportType, Service } from '@store/configuration/model';

export const ConfigurationImportExport: FunctionComponent = () => {
  const { tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
  const exports = useSelector((state: RootState) => state.configurationExport);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const sortedConfiguration = useMemo(() => {
    const schemas = toSchemaMap(tenantConfigDefinitions);
    const namespaces = toNamespaceMap(tenantConfigDefinitions);
    return { schemas: schemas, namespaces: namespaces };
  }, [tenantConfigDefinitions]);

  const dispatch = useDispatch();

  const toggleSelection = (namespace: string, name: string) => {
    const key = toService(namespace, name);
    if (exports[key]) {
      dispatch(clearConfigurationAction(key));
    } else {
      dispatch(getConfiguration(namespace, name));
    }
  };

  const exportButtonName = 'Export configuration';

  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);

  return (
    <div>
      {
        <GoAButton
          data-testid="export-configuration-1"
          disabled={Object.keys(exports).length < 1 || indicator.show}
          onClick={(e) => {
            e.preventDefault();
            downloadSelectedConfigurations(exports);
          }}
        >
          {exportButtonName}
        </GoAButton>
      }
      {indicator.show && <PageIndicator />}
      {Object.keys(sortedConfiguration.namespaces).map((namespace) => {
        return (
          <React.Fragment key={namespace}>
            <h2>{namespace}</h2>
            {sortedConfiguration.namespaces[namespace].map((name) => {
              return (
                <div key={toService(namespace, name)}>
                  <GoACheckbox
                    name={name}
                    checked={!!exports[toService(namespace, name)]}
                    onChange={() => {
                      toggleSelection(namespace, name);
                    }}
                    data-testid={`${toService(namespace, name)}_id`}
                  >
                    {name}
                  </GoACheckbox>
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
      {
        <GoAButton
          data-testid="export-configuration-2"
          disabled={Object.keys(exports).length < 1 || indicator.show}
          onClick={(e) => {
            e.preventDefault();
            downloadSelectedConfigurations(exports);
          }}
        >
          {exportButtonName}
        </GoAButton>
      }
    </div>
  );
};

const downloadSelectedConfigurations = (exports: Record<Service, ConfigurationExportType>): void => {
  const fileName = 'adsp-configuration.json';
  const jsonConfigs = JSON.stringify(toDownloadFormat(exports), null, 2);
  doDownload(fileName, jsonConfigs);
};

const doDownload = (fileName: string, json: string) => {
  //create it.
  const element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8, ' + encodeURIComponent(json));
  element.setAttribute('download', fileName);
  document.body.appendChild(element);

  //click it.
  element.click();

  // kill it.
  document.body.removeChild(element);
};
