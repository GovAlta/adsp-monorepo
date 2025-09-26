import React, { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../store';
import {
  GoAButton,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoACircularProgress,
  GoARadioGroup,
  GoARadioItem,
  GoACheckbox,
  GoABadge,
  GoAButtonGroup,
  GoADetails,
  GoADivider,
} from '@abgov/react-components';
// import { ReactComponent as GreenCircleCheckMark } from '../icons/green-circle-checkmark.svg';
import { ReactComponent as GreenCircleCheckMark } from '../icons/green-circle-checkmark.svg';
import { ReactComponent as Error } from '../icons/close-circle-outline.svg';
import { getFormDefinitions, getExportFormInfo, startSocket, openEditorForDefinition } from '../store/form/action';
import { FormDefinition, Stream, ExportFormat } from '../store/form/model';

import { DownloadFileService, FetchFilesService } from '../store/file/actions';

import { truncateString, transformToColumns, ColumnOption, generateRandomNumber } from './util';

export const FormExport = (): JSX.Element => {
  const dispatch = useDispatch();

  const [selectedForm, setSelectedForm] = useState<FormDefinition>();
  const [resourceType, setResourceType] = useState('');
  const [fileNamePrefix, setFileNamePrefix] = useState('');
  const [exportStream, setExportStream] = useState<Stream>(null);
  const [error, setError] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [downloadDisable, setDownloadDisable] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const formDefinitions = useSelector((state: RootState) => state.form.definitions);
  const exportResult = useSelector((state: RootState) => state.form.exportResult);
  const formList: FormDefinition[] = Object.entries(formDefinitions)
    .map(([, value]) => value)
    .sort((a, b) => a.name.localeCompare(b.name));
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [socketConnection, setSocketConnection] = useState(undefined); // to track socket connection status
  const [socketConnecting, setSocketConnecting] = useState(undefined); // to track socket connection initializing progress
  const [socketDisconnect, setSocketDisconnect] = useState(undefined); // to track socket disconnection status
  const [socketConnectionError, setSocketConnectionError] = useState(undefined); // to track socket unexpected errors status
  const [spinner, setSpinner] = useState(false);

  const socket = useSelector((state: RootState) => state.form?.socket);
  const dataSchema = useSelector((state: RootState) => state.form.editor.resolvedDataSchema) as Record<string, unknown>;
  const next = useSelector((state: RootState) => state.form.nextEntries);
  const fileList = useSelector((state: RootState) => state?.fileService?.fileList);
  const [columns, setColumns] = useState<ColumnOption[]>([]);

  const onDownloadFile = async (file) => {
    file && dispatch(DownloadFileService(file));
  };

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const exportToFile = () => {
    let selectedColumns = [];
    if (exportFormat === 'csv') {
      selectedColumns = columns.filter((col) => col.selected).map((col) => col.id);
    }

    setSpinner(true);

    dispatch(getExportFormInfo(selectedForm.id, resourceType, exportFormat, selectedColumns, fileNamePrefix));
    dispatch(startSocket());

    setLoadingMessage('Exporting File ...');
  };

  // eslint-disable-next-line
  useEffect(() => {
    if (selectedForm) {
      setFileNamePrefix(`Exports-${truncateString(selectedForm?.id)}-${generateRandomNumber()}`);
    }
  }, [selectedForm]);

  // eslint-disable-next-line
  useEffect(() => {
    dispatch(FetchFilesService());
  }, [dispatch, exportStream]);

  // eslint-disable-next-line
  useEffect(() => {
    dispatch(getFormDefinitions());
  }, [dispatch, Object.keys(formDefinitions).length === 0]);

  // eslint-disable-next-line
  useEffect(() => {
    setColumns(transformToColumns(selectedForm, dataSchema));
  }, [exportFormat, selectedForm, dataSchema]);

  useEffect(() => {
    const file = fileList.find((file) => exportStream?.payload?.jobId === file?.recordId);
    if (file) {
      setCurrentFile(file);
      setDownloadDisable(false);
      setSpinner(false);
    }
  }, [fileList, exportStream?.payload?.jobId]);
  // eslint-disable-next-line
  useEffect(() => {
    if (next) {
      dispatch(getFormDefinitions(next));
    }
  }, [dispatch, next === 'NTA=']);

  // eslint-disable-next-line
  useEffect(() => {}, [exportResult]);

  useEffect(() => {
    socket?.on('connect', () => {
      setSocketDisconnect(false);
      setSocketConnectionError(false);
      setSocketConnection(true);
      setSocketConnecting(false);
    });

    socket?.on('disconnect', (reason) => {
      // if connection disconnects from client or server side, consider it as a successful disconnect
      if (reason === 'io client disconnect' || reason === 'io server disconnect') {
        setSocketDisconnect(true);
      }
      // if connection is closed due to an error from client or server, consider this as unexpected error
      // once these errors are caught here, it then goes to connect_error event
      if (reason === 'transport close' || reason === 'transport error') {
        setSocketConnectionError(true);
      }
      setSocketConnection(false);
      setSocketConnecting(false);
    });

    socket?.on('connect_error', (error) => {
      setSocketConnectionError(true);
      setSocketConnection(false);
      setSocketConnecting(false);
      setSocketDisconnect(false);
      setSpinner(false);
    });

    socket?.on(`export-service:export-completed`, (streamData) => {
      if (streamData?.payload?.file?.filename.includes(fileNamePrefix)) {
        setExportStream(streamData);
        setLoadingMessage('Loading File ...');
      }
    });

    socket?.on(`export-service:export-failed`, (streamData) => {
      setError(streamData?.error);
      setSpinner(false);
    });

    return () => {
      socket?.disconnect();
    };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleColumnToggle = (id: string) => {
    setColumns((prevColumns) => prevColumns.map((col) => (col.id === id ? { ...col, selected: !col.selected } : col)));
  };

  const socketStatus = () => {
    if (socketConnectionError || error.length > 0) {
      return (
        <span>
          <p>
            <Error
              data-testid="export-error"
              style={{
                verticalAlign: 'middle',
                height: '24px',
                width: '24px',
                marginRight: '0.5rem',
              }}
            />
            There is issue in exporting, please check and try again!
          </p>
        </span>
      );
    }

    if (socketConnection) {
      return (
        <span>
          <p>
            <GreenCircleCheckMark
              data-testid="export-success-icon"
              style={{
                verticalAlign: 'middle',
                marginRight: '0.5rem',
              }}
            />
            {`Successfully export to file ${exportStream?.payload?.file?.filename}`}
          </p>
        </span>
      );
    }
  };

  return (
    <section>
      <div>
        <GoAFormItem label="Form definition">
          <GoADropdown
            name="formTypes"
            value={selectedForm?.name}
            onChange={(_, value: string) => {
              const currentForm = formList.find((form) => form.name === value);
              setSelectedForm(currentForm);
              setDownloadDisable(true);
              setResourceType(currentForm?.submissionRecords === true ? 'Submissions' : 'Forms');
              setError('');
              dispatch(openEditorForDefinition(currentForm.id));
            }}
            aria-label="form-selection-dropdown"
            width="100%"
            testId="form-selection-dropdown"
            disabled={spinner}
            relative={true}
          >
            {formList.map((item) => (
              <GoADropdownItem
                name="formTypeList"
                key={item?.name}
                label={item?.name}
                value={item?.name}
                testId={`${item?.name}`}
              />
            ))}
          </GoADropdown>
        </GoAFormItem>

        <h3>Records</h3>
        {selectedForm && <GoABadge type="information" content={resourceType}></GoABadge>}
        <br />
        <br />
        <GoAFormItem label="Format">
          <div>
            <GoARadioGroup
              name="formatOptions"
              value={exportFormat}
              onChange={(_, value) => setExportFormat(value as ExportFormat)}
              orientation="horizontal"
              testId="status-radio-group"
              disabled={!selectedForm || Object.keys(formDefinitions).length === 0 || spinner}
            >
              <GoARadioItem name="formatOptions" value="json"></GoARadioItem>
              <GoARadioItem name="formatOptions" value="csv"></GoARadioItem>
            </GoARadioGroup>
            <br />
            {exportFormat === 'csv' && (
              <GoADetails heading="Columns configuration">
                <div>
                  <h4>Standard properties</h4>
                  {columns
                    .filter((col) => col.group === 'Standard properties')
                    .map((col) => (
                      <label key={col.id}>
                        <GoACheckbox
                          name={col.id}
                          text={col.id}
                          checked={col.selected}
                          onChange={() => handleColumnToggle(col.id)}
                        />
                      </label>
                    ))}
                </div>

                <div>
                  <h4>Form data</h4>
                  {columns
                    .sort()
                    .filter((col) => col.group === 'Form data')
                    .map((col) => (
                      <label key={col.id}>
                        <GoACheckbox
                          name={col.id}
                          text={col.id}
                          checked={col.selected}
                          onChange={() => handleColumnToggle(col.id)}
                        />
                      </label>
                    ))}
                </div>
              </GoADetails>
            )}
          </div>
        </GoAFormItem>
        <GoADivider mb="l" />
        {!spinner && (
          <GoAButtonGroup alignment="start">
            <GoAButton
              type="primary"
              size="normal"
              variant="normal"
              onClick={exportToFile}
              testId="export-button"
              disabled={!selectedForm || Object.keys(formDefinitions).length === 0}
            >
              Export
            </GoAButton>

            <GoAButton
              type="secondary"
              testId="export-download-button"
              size="normal"
              disabled={downloadDisable || spinner}
              onClick={() => {
                onDownloadFile(currentFile);
              }}
            >
              Download
            </GoAButton>
          </GoAButtonGroup>
        )}

        {spinner && <GoACircularProgress message={loadingMessage} visible={true} size="small" />}

        <br />
        {!spinner && !downloadDisable && socketStatus()}
      </div>
    </section>
  );
};
