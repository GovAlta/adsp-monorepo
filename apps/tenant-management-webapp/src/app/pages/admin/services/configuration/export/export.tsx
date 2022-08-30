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
import { DescriptionDiv, SelectedExports, Exports } from '../styled-components';
import { GoACard } from '@abgov/react-components/experimental';
import { ReactComponent as Close } from '@assets/icons/close.svg';

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

  const unselectAll = () => {
    setExportServices({});
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

  const [scrollPosition, setScrollPosition] = useState(0);
  const [pageHeight, setPageHeight] = useState(500);
  const handleScroll = () => {
    const position = window.pageYOffset;
    const height = window.innerHeight;
    setScrollPosition(position);
    setPageHeight(height);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const DisplayButton = ({ text }) => {
    return (
      <SelectedExports>
        {text}
        <div className="closePadding">
          <div
            onClick={() => {
              toggleSelection(text);
            }}
          >
            <Close />
          </div>
        </div>
      </SelectedExports>
    );
  };

  return (
    <Exports>
      <h2>Export</h2>
      <p>
        As a tenant admin, you can export the configuration to JSON, so that you could save, and potentially import them
        again later.
      </p>
      {indicator.show && <PageIndicator />}
      <h2 className="header-background">Export configuration list</h2>
      <div className="flex-row">
        <div className="flex-one">
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
        </div>
        {Object.keys(exportServices).length > 0 && (
          <div className="flex-one">
            <div
              className="absolute-position"
              style={{
                marginTop: `${Math.max(scrollPosition - 330, 0)}px`,
              }}
            >
              <h3>Selected Configuration</h3>
              <GoACard type="primary">
                <div
                  className="auto-overflow"
                  style={{
                    maxHeight: `calc(100vh - 608px + ${Math.max(
                      Math.min(scrollPosition, Math.max(pageHeight - 550, 300)),
                      0
                    )}px`,
                  }}
                >
                  {Object.keys(exportServices).map((exp) => {
                    return <DisplayButton text={exp} />;
                  })}
                </div>
                <div className="flex-reverse-row">
                  <div className="button-style">
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
                  <div className="button-style">
                    <GoAButton
                      data-testid="export-configuration-1"
                      buttonType="tertiary"
                      disabled={Object.keys(exportServices).length < 1 || indicator.show}
                      onClick={(e) => {
                        unselectAll();
                      }}
                    >
                      {'Remove All'}
                    </GoAButton>
                  </div>
                </div>
              </GoACard>
            </div>
          </div>
        )}
      </div>
    </Exports>
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
