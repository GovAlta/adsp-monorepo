import React, { FunctionComponent, useEffect, useMemo, useState, useRef } from 'react';
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
import {
  getConfigurationDefinitions,
  getConfigurations,
  ServiceId,
  setConfigurationRevisionAction,
  replaceConfigurationDataAction,
} from '@store/configuration/action';
import { PageIndicator } from '@components/Indicator';
import { ConfigurationExportType, Service, ConfigDefinition } from '@store/configuration/model';
import { GoAForm } from '@abgov/react-components/experimental';
import { ImportModal } from './importModal';

export const ConfigurationImportExport: FunctionComponent = () => {
  const { coreConfigDefinitions, tenantConfigDefinitions } = useSelector((state: RootState) => state.configuration);
  const exportState = useSelector((state: RootState) => state.configurationExport);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);
  const [exportServices, setExportServices] = useState<Record<string, boolean>>({});
  const fileName = useRef() as React.MutableRefObject<HTMLInputElement>;
  const [selectedImportFile, setSelectedImportFile] = useState('');
  const [openImportModal, setOpenImportModal] = useState(false);
  const [importNameList, setImportNameList] = useState([]);
  const [importConfigJson, setImportConfigJson] = useState<ConfigDefinition>(null);
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
  const onUploadSubmit = (e) => {
    e.preventDefault();
    //Todo: Error is shown if the selected file is not in the expected export format
    //open a modal to list impact configuration
    const configList = [];
    const importConfig: ConfigDefinition = JSON.parse(selectedImportFile);
    const configKeys = Object.keys(importConfig);

    for (const config in configKeys) {
      const configItems = Object.keys(importConfig[configKeys[config]]);
      if (configItems && configItems.length > 0) {
        for (const item in configItems) {
          configList.push(`${configKeys[config]}: ${configItems[item]}`);
        }
      }
    }
    setImportConfigJson(importConfig);
    setImportNameList(configList);
    setOpenImportModal(true);
  };

  const onImportChange = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], 'UTF-8');
    fileReader.onload = (e) => {
      const inputJson = e.target.result.toString();
      // Todo: validate json in export format
      setSelectedImportFile(inputJson);
    };
  };
  const onImportCancel = () => {
    setOpenImportModal(false);
  };
  const onImportConfirm = () => {
    setOpenImportModal(false);

    for (const config in importConfigJson) {
      //dispatch(updateConfigurationDefinition(importConfigJson[config], false));
      for (const name in importConfigJson[config]) {
        // Import creates a new revision so there is a snapshot of pre-import revision.
        dispatch(setConfigurationRevisionAction({ namespace: config, name: name }));
        //Import configuration replaces (REPLACE operation in PATCH) the configuration stored in latest revision
        dispatch(
          replaceConfigurationDataAction({
            namespace: config,
            name: name,
            configuration: importConfigJson[config][name].configuration,
          })
        );
      }
    }
  };

  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);

  useEffect(() => {
    if (Object.keys(exportState).length > 0) {
      downloadSelectedConfigurations(exportState);
    }
  }, [exportState]);

  return (
    <div>
      {
        <>
          <GoAForm>
            <input
              type="file"
              onChange={onImportChange}
              aria-label="file import"
              ref={fileName}
              accept="application/JSON"
            />

            <GoAButton type="submit" onClick={onUploadSubmit} disabled={selectedImportFile.length === 0}>
              Import
            </GoAButton>
          </GoAForm>
          <br />
        </>
      }
      {
        <GoAButton
          data-testid="export-configuration-1"
          disabled={Object.keys(exportServices).length < 1 || indicator.show}
          onClick={(e) => {
            e.preventDefault();
            dispatch(getConfigurations(Object.keys(exportServices).map((k) => toServiceId(k))));
          }}
        >
          {'Export configuration'}
        </GoAButton>
      }
      {indicator.show && <PageIndicator />}
      {Object.keys(sortedConfiguration.namespaces).map((namespace) => {
        return (
          <React.Fragment key={namespace}>
            <h2>{namespace}</h2>
            {sortedConfiguration.namespaces[namespace].map((name) => {
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
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
      {
        <GoAButton
          data-testid="export-configuration-1"
          disabled={Object.keys(exportServices).length < 1 || indicator.show}
          onClick={(e) => {
            e.preventDefault();
            dispatch(getConfigurations(Object.keys(exportServices).map((k) => toServiceId(k))));
          }}
        >
          {'Export configuration'}
        </GoAButton>
      }
      {openImportModal && (
        <ImportModal importArray={importNameList} onCancel={onImportCancel} onConfirm={onImportConfirm} />
      )}
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
