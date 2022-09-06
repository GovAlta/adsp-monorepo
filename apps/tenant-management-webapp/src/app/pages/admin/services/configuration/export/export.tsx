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
import { SelectedExports, Exports } from '../styled-components';
import { GoACard } from '@abgov/react-components/experimental';
import { ReactComponent as Close } from '@assets/icons/close.svg';
import { ReactComponent as SmallClose } from '@assets/icons/x.svg';
import { ReactComponent as Triangle } from '@assets/icons/triangle.svg';
import { ReactComponent as Rectangle } from '@assets/icons/rectangle.svg';
import { ReactComponent as InfoCircle } from '@assets/icons/info-circle.svg';

export const ConfigurationExport: FunctionComponent = () => {
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
  const exportState = useSelector((state: RootState) => state.configurationExport);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);
  const [exportServices, setExportServices] = useState<Record<string, boolean>>({});
  const [infoView, setInfoView] = useState<Record<string, boolean>>({});

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

  const toggleInfo = (key: string) => {
    if (infoView[key]) {
      const temp = { ...infoView };
      delete temp[key];
      setInfoView(temp);
    } else {
      setInfoView({
        ...infoView,
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
        <div>{text}</div>
        <div className="closePadding">
          <div
            className="height-20"
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
      <h2 className="header-background">Export configuration list</h2>
      {indicator.show && <PageIndicator />}
      <div className="flex-row">
        <div className="flex-one">
          <div style={{ width: `calc(100% - ${Object.keys(exportServices).length > 0 ? '10px' : '260px'})` }}>
            {Object.keys(sortedConfiguration.namespaces).map((namespace) => {
              return (
                <React.Fragment key={namespace}>
                  <h3>{namespace}</h3>
                  {sortedConfiguration.namespaces[namespace].map((name) => {
                    const desc = getDescription(namespace, name);
                    return (
                      <div>
                        <div key={toServiceKey(namespace, name)} className="flex-row">
                          <div>
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
                          </div>
                          <div
                            className="info-circle"
                            onClick={() => {
                              toggleInfo(toServiceKey(namespace, name));
                            }}
                          >
                            {desc && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  marginTop: '10px',
                                }}
                              >
                                <InfoCircle />
                                <div style={{ width: '30px' }}>
                                  {infoView[toServiceKey(namespace, name)] && (
                                    <div className="bubble-helper">
                                      <div className="triangle">
                                        <Triangle />
                                      </div>
                                      <Rectangle />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          {infoView[toServiceKey(namespace, name)] && (
                            <div className="full-width">
                              <div className="overflow-wrap bubble-border">
                                {desc}
                                <div
                                  className="small-close-button"
                                  onClick={() => {
                                    toggleInfo(toServiceKey(namespace, name));
                                  }}
                                >
                                  <SmallClose />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        {Object.keys(exportServices).length > 0 && (
          <div>
            <div
              style={{
                marginTop: `${Math.max(scrollPosition - 330, 0)}px`,
              }}
            >
              <div className="configuration-selector">
                <GoACard type="primary">
                  <div
                    className="auto-overflow"
                    style={{
                      maxHeight: `calc(100vh - 608px + ${Math.max(
                        Math.min(scrollPosition, Math.max(pageHeight - 550, 300)),
                        0
                      )}px`,
                      minHeight: '100px',
                    }}
                  >
                    <h3>Selected Configuration</h3>
                    <div className="button-wrapper">
                      {Object.keys(exportServices).map((exp) => {
                        return <DisplayButton text={exp} />;
                      })}
                    </div>
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
