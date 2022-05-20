import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { RootState } from '@store/index';
import { toService, toSchemaMap, toNamespaceMap, SchemaRevision, toDownloadFormat } from './ServiceConfiguration';
import { GoAButton, GoACheckbox } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { PageIndicator } from '@components/Indicator';

export const ConfigurationImportExport: FunctionComponent = () => {
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
  const [exports, setExports] = useState<Record<string, SchemaRevision>>({});
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const sortedConfiguration = useMemo(() => {
    const schemas = toSchemaMap(tenantConfigDefinitions, coreConfigDefinitions);
    const namespaces = toNamespaceMap(tenantConfigDefinitions, coreConfigDefinitions);
    return { schemas: schemas, namespaces: namespaces };
  }, [coreConfigDefinitions, tenantConfigDefinitions]);

  const toggleSelection = (namespace: string, name: string) => {
    const key = toService(namespace, name);
    const tmp = { ...exports };
    if (tmp[key]) {
      delete tmp[key];
    } else {
      tmp[key] = sortedConfiguration.schemas[key];
    }
    setExports(tmp);
  };

  const exportButtonName = 'Export configuration';

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);

  return (
    <div>
      {indicator.show && <PageIndicator />}
      {!indicator.show && (
        <GoAButton
          data-testid="export-configuration-1"
          disabled={Object.keys(exports).length < 1}
          onClick={(e) => {
            e.preventDefault();
            downloadSelectedConfigurations(exports);
          }}
        >
          {exportButtonName}
        </GoAButton>
      )}
      {!indicator.show &&
        Object.keys(sortedConfiguration.namespaces).map((namespace) => {
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
      {!indicator.show && (
        <GoAButton
          data-testid="export-configuration-2"
          disabled={Object.keys(exports).length < 1}
          onClick={(e) => {
            e.preventDefault();
            downloadSelectedConfigurations(exports);
          }}
        >
          {exportButtonName}
        </GoAButton>
      )}
    </div>
  );
};

const downloadSelectedConfigurations = (exports: Record<string, SchemaRevision>): void => {
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
