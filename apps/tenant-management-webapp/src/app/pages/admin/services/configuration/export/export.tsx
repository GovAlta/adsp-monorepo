import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { RootState } from '@store/index';
import {
  toServiceKey,
  toSchemaMap,
  toNamespaceMap,
  toDownloadFormat,
  toServiceName,
  toNamespace,
} from './ServiceConfiguration';
import { GoAButton, GoACheckbox } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { getConfigurationDefinitions, getConfigurations, ServiceId } from '@store/configuration/action';
import { PageIndicator } from '@components/Indicator';
import { ConfigurationExportType, Service } from '@store/configuration/model';
import { DescriptionDiv } from '../styled-components';
import styled from 'styled-components';

export const ConfigurationExport: FunctionComponent = () => {
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
  const exportState = useSelector((state: RootState) => state.configurationExport);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);
  const [exportServices, setExportServices] = useState<Record<string, boolean>>({});

  const sortedConfiguration = useMemo(() => {
    const schemas = toSchemaMap(tenantConfigDefinitions, coreConfigDefinitions);
    const namespaces = toNamespaceMap(tenantConfigDefinitions, coreConfigDefinitions);
    return { schemas: schemas, namespaces: namespaces };
  }, [coreConfigDefinitions, tenantConfigDefinitions]);
  const dispatch = useDispatch();

  const toggleSelection = (key: string) => {
    if (exportServices[key]) {
      const temp = { ...exportServices };
      delete temp[key];
      setExportServices(temp);
    } else {
      setExportServices({
        ...exportServices,
        [key]: true,
      });
    }
  };

  const getDescription = (namespace: string, name: string) => {
    const defs = { ...coreConfigDefinitions?.configuration, ...tenantConfigDefinitions?.configuration };
    if (defs[`${namespace}:${name}`]) {
      const schema = defs[`${namespace}:${name}`]['configurationSchema'];
      return schema['description'] || '';
    }
  };

  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);

  useEffect(() => {
    if (Object.keys(exportState).length > 0 && Object.keys(exportServices).length > 0) {
      downloadSelectedConfigurations(exportState);
    }
  }, [exportState]);

  return (
    <div>
      <h2>Export</h2>
      <p>
        As a tenant admin, you can export the configuration to JSON, so that you could save, and potentially import them
        again later.
      </p>
      {indicator.show && <PageIndicator />}
      <ScrollPane>
        <h3 className="header-background">Export configuration list</h3>
        <div className="main">
          {Object.keys(sortedConfiguration.namespaces).map((namespace) => {
            return (
              <React.Fragment key={namespace}>
                <h3>{namespace}</h3>
                {sortedConfiguration.namespaces[namespace].map((name) => {
                  const desc = getDescription(namespace, name);
                  return (
                    <div key={toServiceKey(namespace, name)}>
                      <GoACheckbox
                        name={name}
                        checked={exportServices[toServiceKey(namespace, name)] || false}
                        onChange={() => {
                          toggleSelection(toServiceKey(namespace, name));
                        }}
                        data-testid={`${toServiceKey(namespace, name)}_id`}
                      >
                        {name}
                      </GoACheckbox>
                      {desc && <DescriptionDiv>{`Description: ${desc}`}</DescriptionDiv>}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
        <div className="export-button">
          <GoAButton
            data-testid="export-configuration-1"
            disabled={Object.keys(exportServices).length < 1 || indicator.show}
            onClick={(e) => {
              e.preventDefault();
              dispatch(getConfigurations(Object.keys(exportServices).map((k) => toServiceId(k))));
            }}
          >
            {'Export'}
          </GoAButton>
        </div>
      </ScrollPane>
    </div>
  );
};

const toServiceId = (key: string): ServiceId => {
  return { namespace: toNamespace(key), service: toServiceName(key) };
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

const ScrollPane = styled.div`
  border: 1px solid black;

  .header-background {
    background: #f1f1f1;
    padding: 10px;
  }

  .main {
    padding: 10px;
    max-height: calc(100vh - 525px);
    overflow-y: scroll;
  }

  .export-button {
    padding: 10px;
    text-align-last: end;
  }
`;
