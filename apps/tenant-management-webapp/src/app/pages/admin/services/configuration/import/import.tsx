import React, { FunctionComponent, useEffect, useState, useRef } from 'react';
import { RootState } from '@store/index';
import { GoAButton } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import {
  getConfigurationDefinitions,
  setConfigurationRevisionAction,
  replaceConfigurationDataAction,
  getReplaceConfigurationErrorAction,
  resetReplaceConfigurationListAction,
  resetImportsListAction,
} from '@store/configuration/action';
import { PageIndicator } from '@components/Indicator';
import { ConfigDefinition } from '@store/configuration/model';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { ImportModal } from './importModal';
import { isValidJSONCheck, jsonSchemaCheck } from '@lib/checkInput';
import { ErrorStatusText } from '../styled-components';
import JobList from './jobList';
import { Import } from '../styled-components';

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
  const imports = useSelector((state: RootState) => state.configuration.imports);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const fileName = useRef() as React.MutableRefObject<HTMLInputElement>;

  const [selectedImportFile, setSelectedImportFile] = useState('');
  const [openImportModal, setOpenImportModal] = useState(false);
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
    setErrorsStatus('');
    setImportNameList([]);
    dispatch(resetReplaceConfigurationListAction());
  };
  const onImportCancel = () => {
    setOpenImportModal(false);
  };
  const onImportConfirm = () => {
    setOpenImportModal(false);

    dispatch(resetImportsListAction());

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
  };

  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, []);

  useEffect(() => {
    dispatch(getReplaceConfigurationErrorAction());
  }, [imports]);

  return (
    <Import>
      {
        <div>
          <h2>Import</h2>
          <p className="pb3">
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
              <button
                className="choose-button"
                data-testid="import-input-button"
                onClick={() => fileName.current.click()}
              >
                {' Choose a file'}
              </button>

              <div style={{ marginTop: '0.5rem' }}>
                {fileName?.current?.value ? fileName.current.value.split('\\').pop() : 'No file was chosen'}
              </div>
            </GoAFormItem>
            <GoAButton
              type="primary"
              onClick={onUploadSubmit}
              disabled={selectedImportFile.length === 0}
              data-testid="import-input-button"
            >
              Import
            </GoAButton>
            <br />
            {errorsStatus && (
              <ErrorStatusText>
                {errorsStatus}
                <br />
              </ErrorStatusText>
            )}
            <section>
              <JobList />
            </section>
          </GoAForm>
          <br />
        </div>
      }
      {indicator.show && <PageIndicator />}
      {openImportModal && (
        <ImportModal importArray={importNameList} onCancel={onImportCancel} onConfirm={onImportConfirm} />
      )}
    </Import>
  );
};
