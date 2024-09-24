import React, { FunctionComponent, useEffect, useState } from 'react';
import { RootState } from '@store/index';
import { GoAButton, GoAFormItem, GoAFileUploadInput, GoAFileUploadCard } from '@abgov/react-components-new';
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
import { ErrorStatusText } from '../styled-components';
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

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progressList, setProgressList] = useState<Record<string, number>>({});
  const [selectedImportFile, setSelectedImportFile] = useState<string>('');
  const [openImportModal, setOpenImportModal] = useState(false);
  const [jobsInUse, setJobsInUse] = useState(false);
  const [importNameList, setImportNameList] = useState<string[]>([]);
  const [importConfigJson, setImportConfigJson] = useState<ConfigDefinition | null>(null);
  const [errorsStatus, setErrorsStatus] = useState<string>('');
  const dispatch = useDispatch();

  const onUploadSubmit = () => {
    setErrorsStatus('');
    const jsonValidationFormat = isValidJSONCheck()(selectedImportFile);
    if (jsonValidationFormat !== '') {
      setErrorsStatus('Invalid Json format! please check!');
      setSelectedImportFile('');
      return;
    }

    const jsonSchemaValidation = jsonSchemaCheck(exportSchema, selectedImportFile);
    if (!jsonSchemaValidation) {
      setErrorsStatus('The json file does not match the Configuration schema');
      setSelectedImportFile('');
      return;
    }

    const configList: string[] = [];
    const importConfig: ConfigDefinition = JSON.parse(selectedImportFile);
    const configKeys = Object.keys(importConfig);

    for (const config of configKeys) {
      const configItems = Object.keys(importConfig[config]);
      if (configItems.length > 0) {
        for (const item of configItems) {
          if (importConfig[config][item]?.configuration) {
            configList.push(`${config}: ${item}`);
          }
        }
      }
    }

    if (configList.length === 0) {
      setErrorsStatus('The json file does not match the Configuration schema');
      return;
    }

    dispatch(resetReplaceConfigurationListAction());
    setImportConfigJson(importConfig);
    setImportNameList(configList);
    setOpenImportModal(true);
  };

  const uploadFile = (file: File) => {
    const reader = new FileReader();
    setUploadedFile(null);
    setProgressList({});
    setProgressList({ [file.name]: 0 });
    reader.onloadstart = () => {
      setProgressList({ [file.name]: 20 });
    };
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result as string;
      if (result) {
        setSelectedImportFile(result);
      }
      setErrorsStatus('');
      setProgressList({ [file.name]: 100 });
    };
    reader.onerror = () => {
      setErrorsStatus('Error reading file');
      setProgressList({ [file.name]: 0 });
    };

    reader.readAsText(file);
    setUploadedFile(file);
  };

  const deleteFile = () => {
    setUploadedFile(null);
    setProgressList({});
    setErrorsStatus('');
  };

  const onImportCancel = () => {
    setOpenImportModal(false);
  };

  const onImportConfirm = () => {
    setOpenImportModal(false);
    setSelectedImportFile('');
    setJobsInUse(true);
    dispatch(resetImportsListAction());

    if (importConfigJson) {
      for (const config in importConfigJson) {
        for (const name in importConfigJson[config]) {
          if (importConfigJson[config][name]?.configuration) {
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
      <div>
        <NoPaddingH2>Import</NoPaddingH2>
        <p className="pb3">
          As a tenant admin, you can import configuration from a JSON file, so that you can apply previously exported
          configuration.
        </p>

        <GoAFormItem label="Upload a file">
          <GoAFileUploadInput
            onSelectFile={uploadFile}
            variant="button"
            maxFileSize="100MB"
            data-testid="import-input"
          />
          {uploadedFile && (
            <GoAFileUploadCard
              key={uploadedFile.name}
              filename={uploadedFile.name}
              type={uploadedFile.type}
              size={uploadedFile.size}
              progress={progressList[uploadedFile.name]}
              onDelete={deleteFile}
              onCancel={deleteFile}
              data-testid="import-input-button"
            />
          )}
        </GoAFormItem>

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

        <ImportModal
          isOpen={openImportModal}
          importArray={importNameList}
          onCancel={onImportCancel}
          onConfirm={onImportConfirm}
        />
      </div>
    </section>
  );
};
