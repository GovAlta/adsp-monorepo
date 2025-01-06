import React, { useEffect, useState, useRef } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import {
  GoAButton,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAIconButton,
  GoACircularProgress,
} from '@abgov/react-components-new';
import { getFormDefinitions, getExportFormInfo, startSocket } from '@store/form/action';
import { FormDefinition, Stream } from '@store/form/model';

import { DownloadFileService, FetchFilesService } from '@store/file/actions';
import { ExportWrapper } from '../styled-components';

export const FormExport = (): JSX.Element => {
  const dispatch = useDispatch();

  const [selectedForm, setSelectedForm] = useState<FormDefinition>();
  const [resourceType, setResourceType] = useState('');
  const [exportStream, setExportStream] = useState<Stream>(null);
  const [error, setError] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [iconDisable, setIconDisable] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const formDefinitions = useSelector((state: RootState) => state.form.definitions);
  const exportResult = useSelector((state: RootState) => state.form.exportResult);
  const formList: FormDefinition[] = Object.entries(formDefinitions)
    .map(([, value]) => value)
    .sort((a, b) => a.name.localeCompare(b.name));

  const [socketConnection, setSocketConnection] = useState(undefined); // to track socket connection status
  const [socketConnecting, setSocketConnecting] = useState(undefined); // to track socket connection initializing progress
  const [socketDisconnect, setSocketDisconnect] = useState(undefined); // to track socket disconnection status
  const [socketConnectionError, setSocketConnectionError] = useState(undefined); // to track socket unexpected errors status
  const [spinner, setSpinner] = useState(false);
  const spinnerTimeout = useRef(null);
  const socket = useSelector((state: RootState) => state.form?.socket);

  const next = useSelector((state: RootState) => state.form.nextEntries);
  const fileList = useSelector((state: RootState) => state?.fileService?.fileList);

  const onDownloadFile = async (file) => {
    file && dispatch(DownloadFileService(file));
  };

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);
  const exportToFile = () => {
    if (selectedForm?.submissionRecords === true) {
      dispatch(getExportFormInfo(selectedForm?.id, 'submissions'));
    } else {
      dispatch(getExportFormInfo(selectedForm.id, 'forms'));
    }
    dispatch(startSocket());
    setSpinner(true);
    setLoadingMessage('Exporting File ...');
  };

  useEffect(() => {
    dispatch(FetchFilesService());
  }, [exportStream]);

  useEffect(() => {
    const file = fileList.find((file) => exportStream?.payload?.jobId === file?.recordId);
    if (file) {
      setCurrentFile(file);
      setIconDisable(false);
      setSpinner(false);
    }
  }, [fileList]);

  useEffect(() => {
    if (next) {
      dispatch(getFormDefinitions(next));
    }
  }, [next === 'NTA=']);

  useEffect(() => {}, [exportResult]);

  useEffect(() => {
    socket?.on('connect', () => {
      clearTimeout(spinnerTimeout.current);
      setSocketDisconnect(false);
      setSocketConnectionError(false);
      setSocketConnection(true);
      setSocketConnecting(false);
    });

    socket?.on('disconnect', (reason) => {
      clearTimeout(spinnerTimeout.current);
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
      setSpinner(false);
    });

    socket?.on('connect_error', (error) => {
      clearTimeout(spinnerTimeout.current);
      setSocketConnectionError(true);
      setSocketConnection(false);
      setSocketConnecting(false);
      setSocketDisconnect(false);
      setSpinner(false);
    });

    socket?.on(`export-service:export-completed`, (streamData) => {
      setExportStream(streamData);
      setLoadingMessage('Loading File ...');
    });
    socket?.on(`export-service:export-failed`, (streamData) => {
      setError(streamData?.error);
      setSpinner(false);
    });

    return () => {
      socket?.disconnect();
    };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const socketStatus = () => {
    if (socketConnection === undefined) {
      return;
    }
    if (socketDisconnect) {
      return 'Disconnecting from stream was successful';
    }
    if (socketConnectionError) {
      return 'Failed to connect the stream, please try to reconnect';
    }
    if (socketConnection) {
      return 'Connected to the stream';
    }
    if (error.length > 0) {
      return error;
    }
  };

  return (
    <section>
      <div>
        <GoAFormItem label="Form types">
          <GoADropdown
            name="formTypes"
            value={selectedForm?.name}
            onChange={(_, value: string) => {
              const currentForm = formList.find((form) => form.name === value);
              setSelectedForm(currentForm);
              setIconDisable(true);
              setResourceType(currentForm?.submissionRecords === true ? 'Submissions' : 'Forms');
              setError('');
            }}
            aria-label="form-selection-dropdown"
            width="100%"
            testId="form-selection-dropdown"
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
        <br />
        <GoAFormItem label="Records">
          <h3>{resourceType}</h3>
        </GoAFormItem>
        <br />
        <ExportWrapper>
          <GoAButton
            type="primary"
            size="normal"
            variant="normal"
            onClick={exportToFile}
            testId="exportBtn"
            disabled={!selectedForm || Object.keys(formDefinitions).length === 0}
          >
            Export
          </GoAButton>
          <GoAIconButton
            icon="download"
            title="Download"
            testId="download-template-icon"
            size="medium"
            disabled={iconDisable}
            onClick={() => {
              onDownloadFile(currentFile);
            }}
          />
        </ExportWrapper>

        {spinner && <GoACircularProgress variant="fullscreen" message={loadingMessage} visible={true} size="small" />}
        <br />
        <span>
          <p>{socketStatus()}</p>
        </span>
      </div>
    </section>
  );
};
