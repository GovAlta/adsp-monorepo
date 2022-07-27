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
  getReplaceConfigurationErrorAction,
  resetReplaceConfigurationListAction,
} from '@store/configuration/action';
import { PageIndicator } from '@components/Indicator';
import { ConfigurationExportType, Service, ConfigDefinition } from '@store/configuration/model';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { ImportModal } from './importModal';
import { isValidJSONCheck, jsonSchemaCheck } from '@lib/checkInput';
import { StatusText, StatusIcon, DescriptionDiv, ErrorStatusText } from '../styled-components';
import GreenCircleCheckMark from '@icons/green-circle-checkmark.svg';
import CloseCircle from '@components/icons/CloseCircle';

const exportSchema = {
  type: 'string',
  additionalProperties: {
    type: 'string',
    additionalProperties: {
      type: 'object',
    },
  },
};

export const ConfigurationImport: FunctionComponent = () => {
  const { coreConfigDefinitions, tenantConfigDefinitions, importedConfigurationError } = useSelector(
    (state: RootState) => state.configuration
  );
  const exportState = useSelector((state: RootState) => state.configurationExport);
  const lastImport = useSelector((state: RootState) => state.configuration.lastImport);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const fileName = useRef() as React.MutableRefObject<HTMLInputElement>;

  const [selectedImportFile, setSelectedImportFile] = useState('');
  const [openImportModal, setOpenImportModal] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [importNameList, setImportNameList] = useState([]);
  const [importConfigJson, setImportConfigJson] = useState<ConfigDefinition>(null);

  const [errorsStatus, setErrorsStatus] = useState<string>('');
  const dispatch = useDispatch();

  const onUploadSubmit = (e) => {
    e.preventDefault();
    setErrorsStatus('');
    //Open a modal to list impact configuration
    const jsonValidationFormat = isValidJSONCheck()(selectedImportFile);

    if (jsonValidationFormat !== '') {
      setErrorsStatus('Invalid Json format! please check!');
      setSelectedImportFile('');
      return;
    }
    const jsonSchemaValidation = jsonSchemaCheck(exportSchema, selectedImportFile);
    if (!jsonSchemaValidation) {
      setErrorsStatus('The json file not match Configuration schema');
      setSelectedImportFile('');
      return;
    }
    const configList = [];
    const importConfig: ConfigDefinition = JSON.parse(selectedImportFile);
    const configKeys = Object.keys(importConfig);

    for (const config in configKeys) {
      const configItems = Object.keys(importConfig[configKeys[config]]);
      if (configItems && configItems.length > 0) {
        for (const item in configItems) {
          if (
            importConfig[configKeys[config]][configItems[item]] !== null &&
            importConfig[configKeys[config]][configItems[item]].configuration
          ) {
            configList.push(`${configKeys[config]}: ${configItems[item]}`);
          }
        }
      }
    }
    if (configList.length === 0) {
      setErrorsStatus('The json file not match Configuration schema');
      return;
    }
    dispatch(resetReplaceConfigurationListAction());
    setImportConfigJson(importConfig);
    setImportNameList(configList);
    setOpenImportModal(true);
    setSelectedImportFile('');
  };

  const onImportChange = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], 'UTF-8');
    fileReader.onload = (e) => {
      const inputJson = e.target.result.toString();

      setSelectedImportFile(inputJson);
    };
    setShowStatus(false);
    setErrorsStatus('');
    setImportNameList([]);
    dispatch(resetReplaceConfigurationListAction());
  };
  const onImportCancel = () => {
    setOpenImportModal(false);
  };
  const onImportConfirm = () => {
    setOpenImportModal(false);

    for (const config in importConfigJson) {
      for (const name in importConfigJson[config]) {
        if (importConfigJson[config][name] !== null && importConfigJson[config][name].configuration) {
          // Import creates a new revision so there is a snapshot of pre-import revision.
          const setConfig = dispatch(setConfigurationRevisionAction({ namespace: config, name: name }));

          //Import configuration replaces (REPLACE operation in PATCH) the configuration stored in latest revision
          if (setConfig) {
            dispatch(
              replaceConfigurationDataAction({
                namespace: config,
                name: name,
                configuration: importConfigJson[config][name].configuration,
              })
            );
          }
        }
      }
    }
    dispatch(getReplaceConfigurationErrorAction());

    setShowStatus(true);
  };

  const renderStatusWithIcon = () => {
    return (
      <div style={{ display: 'flex' }}>
        <StatusIcon>
          {importedConfigurationError.length > 0 ? (
            <CloseCircle size="medium" />
          ) : (
            <img src={GreenCircleCheckMark} width="16" alt="status" />
          )}
        </StatusIcon>
        <div>
          {importedConfigurationError.length > 0
            ? `  Import ${fileName?.current?.value.split('\\').pop()} failed. Error list:  ${importedConfigurationError
                .toString()
                .split(' ,')
                .join(', ')}`
            : `   ${fileName?.current?.value.split('\\').pop()}  Imported successfully. ${JSON.stringify(lastImport)} `}
        </div>
      </div>
    );
  };

  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);

  return (
    <div>
      {
        <div>
          <h2>Import</h2>
          <p>
            As a tenant admin, you can import configuration from JSON file, so that you can apply previously exported
            configuration.
          </p>
          <GoAForm>
            <GoAFormItem>
              <input
                id="file-uploads"
                name="inputJsonFile"
                type="file"
                onChange={onImportChange}
                aria-label="file import"
                ref={fileName}
                accept="application/JSON"
                data-testid="import-input"
                style={{ display: 'none' }}
                onClick={(event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
                  const element = event.target as HTMLInputElement;
                  element.value = '';
                }}
              />
              <button data-testid="import-input-button" onClick={() => fileName.current.click()}>
                {' Choose a file'}
              </button>

              <div style={{ marginTop: '0.5rem' }}>
                {fileName?.current?.value ? fileName.current.value.split('\\').pop() : 'No file was chosen'}
              </div>
            </GoAFormItem>
            <GoAButton
              type="submit"
              onClick={onUploadSubmit}
              disabled={selectedImportFile.length === 0}
              data-testid="import-input-button"
            >
              Import
            </GoAButton>
            <br />
            {importedConfigurationError && showStatus && (
              <StatusText>
                {renderStatusWithIcon()}
                <br />
              </StatusText>
            )}
            {errorsStatus && (
              <ErrorStatusText>
                {errorsStatus}
                <br />
              </ErrorStatusText>
            )}
          </GoAForm>
          <br />
        </div>
      }
      {indicator.show && <PageIndicator />}
      {openImportModal && (
        <ImportModal importArray={importNameList} onCancel={onImportCancel} onConfirm={onImportConfirm} />
      )}
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
