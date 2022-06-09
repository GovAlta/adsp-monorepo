import React, { useEffect, useState } from 'react';
import { RootState } from '@store/index';
import { fetchEventStreams, startSocket } from '@store/stream/actions';
import { useDispatch, useSelector } from 'react-redux';
import { PageIndicator } from '@components/Indicator';
import { GoAButton, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { Divider, StreamHeading, StreamsDropdown } from './styledComponents';
import { GoAForm, GoABadge } from '@abgov/react-components/experimental';
import { StreamPayloadTable } from './streamPayloadTable';

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
  const [socketConnection, setSocketConnection] = useState(false);
  const [streamData, setStreamData] = useState([]);

  useEffect(() => {
    dispatch(fetchEventStreams());
  }, []);

  // socket connection
  useEffect(() => {
    socket?.on('connect', () => {
      setSocketConnection(true);
    });
    socket?.on('disconnect', () => {
      setSocketConnection(false);
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

  return (
    <>
      {indicator.show && <PageIndicator />}
      {!indicator.show && streams && (
        <>
          <GoAForm>
            <StreamHeading>Please select a stream to test</StreamHeading>
            <span>
              {socketConnection ? (
                <GoABadge type={'success'} content={'connected'} />
              ) : (
                <GoABadge type={'midtone'} content={'disconnected'} />
              )}
            </span>
            <StreamsDropdown>
              <GoADropdown
                disabled={socketConnection}
                name="fileType"
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
            <GoAButton
              type="submit"
              buttonType="primary"
              disabled={socketConnection}
              onClick={() => {
                dispatch(startSocket(`${pushServiceUrl}/${tenant?.name}`, selectedSteamId[0]));
              }}
            >
              Connect
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
