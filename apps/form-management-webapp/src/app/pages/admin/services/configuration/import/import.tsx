import React, { FunctionComponent, useEffect, useState, useRef } from 'react';
import { RootState } from '@store/index';
import { GoAButton, GoAFormItem } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import {
  getConfigurationDefinitions,
  replaceConfigurationDataAction,
  getReplaceConfigurationErrorAction,
  resetReplaceConfigurationListAction,
  resetImportsListAction,
} from '@store/configuration/action';
import { ConfigDefinition } from '@store/configuration/model';
import { ImportModal } from './importModal';
import { isValidJSONCheck, jsonSchemaCheck } from '@lib/validation/checkInput';
import { ErrorStatusText, Import } from '../styled-components';
import JobList from './jobList';
import { NoPaddingH2 } from '@components/AppHeader';

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

  const fileName = useRef() as React.MutableRefObject<HTMLInputElement>;

  const [selectedImportFile, setSelectedImportFile] = useState('');
  const [openImportModal, setOpenImportModal] = useState(false);
  const [jobsInUse, setJobsInUse] = useState(false);
  const [importNameList, setImportNameList] = useState([]);
  const [importConfigJson, setImportConfigJson] = useState<ConfigDefinition>(null);

  const [errorsStatus, setErrorsStatus] = useState<string>('');
  const dispatch = useDispatch();

  const onUploadSubmit = () => {
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
    setSelectedImportFile('');
    setJobsInUse(true);

    dispatch(resetImportsListAction());

    for (const config in importConfigJson) {
      for (const name in importConfigJson[config]) {
        if (importConfigJson[config][name] !== null && importConfigJson[config][name].configuration) {
          dispatch(
            replaceConfigurationDataAction(
              {
                namespace: config,
                name: name,
                configuration: importConfigJson[config][name].configuration,
              },
              true
            )
          );
        }
      }
    }
  };

  useEffect(() => {
    dispatch(getConfigurationDefinitions());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getReplaceConfigurationErrorAction());
  }, [imports, dispatch]);

  return (
    <section>
      {
        <div>
          <NoPaddingH2>Import</NoPaddingH2>
          <p className="pb3">
            As a tenant admin, you can import configuration from JSON file, so that you can apply previously exported
            configuration.
          </p>

          <GoAFormItem label="">
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
          </GoAFormItem>

          <div className="row-flex">
            <button
              className="choose-button"
              data-testid="import-input-button"
              onClick={() => fileName.current.click()}
            >
              {' Choose a file'}
            </button>

            <div className="margin-left">
              {fileName?.current?.value ? fileName.current.value.split('\\').pop() : 'No file was chosen'}
            </div>
          </div>

          <GoAButton
            type="primary"
            onClick={onUploadSubmit}
            disabled={selectedImportFile.length === 0}
            testId="import-input-button"
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
          <section>{jobsInUse && <JobList />}</section>

          <br />
        </div>
      }

      <ImportModal
        isOpen={openImportModal}
        importArray={importNameList}
        onCancel={onImportCancel}
        onConfirm={onImportConfirm}
      />
    </section>
  );
};
