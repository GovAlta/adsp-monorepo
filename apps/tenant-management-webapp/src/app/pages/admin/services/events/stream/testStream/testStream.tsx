import React, { useEffect, useRef, useState } from 'react';
import { RootState } from '@store/index';
import { fetchEventStreams, startSocket } from '@store/stream/actions';
import { useDispatch, useSelector } from 'react-redux';
import { PageIndicator } from '@components/Indicator';
import { TextGoASkeleton } from '@core-services/app-common';
import { GoabDropdown, GoabDropdownItem, GoabButton } from '@abgov/react-components';
import { Divider, StreamHeading, StreamsDropdown } from './styledComponents';
import { ReactComponent as GreenCircleCheckMark } from '@icons/green-circle-checkmark.svg';
import { ReactComponent as Error } from '@icons/close-circle-outline.svg';
import { StreamPayloadTable } from './streamPayloadTable';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
const Icons = {
  greenCircleCheckMark: (
    <GreenCircleCheckMark
      data-testid="green-circle-checkmark-icon"
      style={{
        verticalAlign: 'middle',
      }}
    />
  ),
  error: (
    <Error
      data-testid="warning-icon"
      style={{
        verticalAlign: 'middle',
        height: '24px',
        width: '24px',
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // socket connection
  useEffect(() => {
    socket?.on('connect', () => {
      clearTimeout(spinnerTimeout.current);
      setSocketDisconnect(false);
      setSocketConnectionError(false);
      setSocketConnection(true);
      setSocketConnecting(false);
      setSpinner(false);
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
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const disableConnectButton = () => {
    if (socketConnecting) {
      return true;
    }
    if (socket && socketConnection) {
      return true;
    }
    if (selectedSteamId.length === 0) {
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
          <p>{Icons.error} Failed to connect the stream, please try to reconnect</p>
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
    <section>
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

          <StreamsDropdown>
            <GoabDropdown
              disabled={socketConnection}
              name="streams"
              value={selectedSteamId}
              width="100%"
              onChange={(detail: GoabDropdownOnChangeDetail) => {
                setSelectedStreamId([detail.values.toString()]);
              }}
              aria-label="select-test-stream-dropdown"
            >
              {Object.keys(streams)
                .filter((streamId) => streamId !== 'webhooks')
                .sort(([a], [b]) => a.localeCompare(b))
                .map((streamId) => (
                  <GoabDropdownItem label={streams[streamId].name} value={streamId} key={streamId} testId={streamId} />
                ))}
            </GoabDropdown>
          </StreamsDropdown>
          {socketStatus()}
          <GoabButton
            type="primary"
            disabled={disableConnectButton()}
            onClick={() => {
              setSocketConnecting(true);
              spinnerTimeout.current = setTimeout(() => setSpinner(true), 2000);
              dispatch(startSocket(`${pushServiceUrl}/${tenant?.name}`, selectedSteamId[0]));
            }}
          >
            Connect
          </GoabButton>
          <Divider />
          <GoabButton
            type="secondary"
            disabled={!socketConnection}
            onClick={() => {
              socket.disconnect();
            }}
          >
            Disconnect
          </GoabButton>
          <br />
          <StreamPayloadTable streams={streamData} />
          {spinner && <TextGoASkeleton lineCount={1}></TextGoASkeleton>}
        </>
      )}
    </section>
  );
};
