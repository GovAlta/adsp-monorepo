import React, { useEffect, useRef, useState } from 'react';
import { RootState } from '@store/index';
import { fetchEventStreams, startSocket } from '@store/stream/actions';
import { useDispatch, useSelector } from 'react-redux';
import { PageIndicator } from '@components/Indicator';
import { GoAButton, GoADropdown, GoADropdownOption, GoAElementLoader } from '@abgov/react-components';
import { Divider, StreamHeading, StreamsDropdown } from './styledComponents';
import { GoAForm } from '@abgov/react-components/experimental';
import { ReactComponent as GreenCircleCheckMark } from '@icons/green-circle-checkmark.svg';
import { ReactComponent as Warning } from '@icons/warning.svg';
import { StreamPayloadTable } from './streamPayloadTable';
import styled from 'styled-components';

const Icons = {
  greenCircleCheckMark: (
    <GreenCircleCheckMark
      data-testid="green-circle-checkmark-icon"
      style={{
        verticalAlign: 'middle',
      }}
    />
  ),
  warning: (
    <Warning
      data-testid="warning-icon"
      style={{
        verticalAlign: 'middle',
      }}
    />
  ),
};

export const TestStream = (): JSX.Element => {
  const dispatch = useDispatch();

  const tenantStreams = useSelector((state: RootState) => state.stream?.tenant);
  const coreStreams = useSelector((state: RootState) => state.stream?.core);
  const socket = useSelector((state: RootState) => state.stream?.socket);
  const tenant = useSelector((state: RootState) => state.tenant);
  const pushServiceUrl = useSelector((state: RootState) => state.config.serviceUrls?.pushServiceApiUrl);

  const streams = {
    ...tenantStreams,
    ...coreStreams,
  };
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const [selectedSteamId, setSelectedStreamId] = useState<string[]>([]);
  const [socketConnection, setSocketConnection] = useState(undefined); // to track socket connection status
  const [socketConnecting, setSocketConnecting] = useState(undefined); // to track socket connection initializing progress
  const [socketDisconnect, setSocketDisconnect] = useState(undefined); // to track socket disconnection status
  const [socketConnectionError, setSocketConnectionError] = useState(undefined); // to track socket unexpected errors status
  const [spinner, setSpinner] = useState(false);
  const [streamData, setStreamData] = useState([]);
  const spinnerTimeout = useRef(null);

  useEffect(() => {
    dispatch(fetchEventStreams());
  }, []);

  // socket connection
  useEffect(() => {
    socket?.on('connect', () => {
      clearTimeout(spinnerTimeout.current);
      setSocketConnection(true);
      setSocketConnecting(false);
      setSpinner(false);
      setSocketDisconnect(false);
      setSocketConnectionError(false);
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
    });
    socket?.on('connect_error', (error) => {
      clearTimeout(spinnerTimeout.current);
      setSocketConnectionError(true);
      setSocketConnection(false);
      setSocketDisconnect(false);
    });
    // once we have socket init, available streams and a stream selected by user then start listening to streams
    // TO-DO: we can use a wrapper of some sort here in the future for re-usability
    if (tenantStreams && coreStreams && socket && selectedSteamId[0]) {
      for (const event of streams[selectedSteamId[0]].events) {
        socket.on(`${event.namespace}:${event.name}`, (streamData) => {
          setStreamData((oldArr) => [streamData, ...oldArr]);
        });
      }
    }
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const disableConnectButton = () => {
    if (selectedSteamId.length === 0) {
      return true;
    }
    if (socketConnecting) {
      return true;
    }
    if (socket && socketConnection) {
      return true;
    }
  };

  const socketStatus = () => {
    if (socketConnection === undefined) {
      return;
    }
    if (socketDisconnect) {
      return (
        <span>
          <p>{Icons.greenCircleCheckMark} Disconnecting from stream was successful</p>
        </span>
      );
    }
    if (socketConnectionError) {
      return (
        <span>
          <p>{Icons.warning} stream was unexpectedly disconnected, please try to reconnect</p>
        </span>
      );
    }
    if (socketConnection) {
      return (
        <span>
          <p>{Icons.greenCircleCheckMark} Connected to the stream</p>
        </span>
      );
    }
  };

  return (
    <>
      {indicator.show && <PageIndicator />}
      {!indicator.show && streams && (
        <>
          <h2>Test stream</h2>
          <p>
            Connect to streams to view and verify the included events. Leaving this test view will disconnect from any
            connected stream. Use another tab or window or APIs to trigger events for testing. In your own applications,
            use &nbsp;
            <a rel="noreferrer" target="_blank" href="https://socket.io/docs/v4/client-api/">
              Socket.Io client
            </a>
            &nbsp; to connect to streams.
          </p>
          <StreamHeading>Please select a stream to test</StreamHeading>
          <GoAForm>
            <StreamsDropdown>
              <GoADropdown
                disabled={socketConnection}
                name="streams"
                selectedValues={selectedSteamId}
                multiSelect={false}
                onChange={(name, streamId) => {
                  setSelectedStreamId(streamId);
                }}
              >
                {Object.keys(streams).map((streamId) => (
                  <GoADropdownOption
                    label={streams[streamId].name}
                    value={streamId}
                    key={streamId}
                    data-testid={streamId}
                  />
                ))}
              </GoADropdown>
            </StreamsDropdown>
            {socketStatus()}
            <GoAButton
              type="submit"
              buttonType="primary"
              disabled={disableConnectButton()}
              onClick={() => {
                setSocketConnecting(true);
                spinnerTimeout.current = setTimeout(() => setSpinner(true), 2000);
                dispatch(startSocket(`${pushServiceUrl}/${tenant?.name}`, selectedSteamId[0]));
              }}
            >
              Connect
              {spinner && (
                <SpinnerPadding>
                  <GoAElementLoader visible={true} size="default" baseColour="#c8eef9" spinnerColour="#0070c4" />
                </SpinnerPadding>
              )}
            </GoAButton>
            <Divider />
            <GoAButton
              type="submit"
              buttonType="secondary"
              disabled={!socketConnection}
              onClick={() => {
                socket.disconnect();
              }}
            >
              Disconnect
            </GoAButton>
          </GoAForm>
          <br />
          <StreamPayloadTable streams={streamData} />
        </>
      )}
    </>
  );
};

const SpinnerPadding = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;
