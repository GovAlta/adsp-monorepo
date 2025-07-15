import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TestWebhooks } from '@store/status/actions';
import { getEventLogEntries, clearEventLogEntries } from '@store/event/actions';
import { GoAButton, GoAButtonGroup, GoARadioItem, GoARadioGroup, GoAModal, GoAFormItem } from '@abgov/react-components';
import { selectWebhookToTestInStatus, selectInitTestWebhookCriteria } from '@store/status/selectors';
import { renderNoItem } from '@components/NoItem';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { ResetModalState } from '@store/session/actions';
import { PageIndicator } from '@components/Indicator';
import { EntryDetail } from '../../styled-components';
export const TestWebhookModal = (): JSX.Element => {
  const dispatch = useDispatch();

  const [showEntries, setShowEntries] = useState<boolean>(false);
  const webhook = useSelector(selectWebhookToTestInStatus);

  const events = webhook?.eventTypes.map((e) => e.id.split(':')[1]);

  const [selectedStatusName, setSelectedStatusName] = useState<string>(events && events[0]);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const entries = useSelector((state: RootState) => state.event.entries);
  const testSuccess = useSelector((state: RootState) => state.serviceStatus.testSuccess);
  const initCriteria = useSelector(selectInitTestWebhookCriteria);

  useEffect(() => {
    if (testSuccess) {
      dispatch(getEventLogEntries('', initCriteria));
      setShowEntries(true);
    }
  }, [testSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedStatusName(events && events[0]);
  }, [webhook, entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const definitions = useSelector((state: RootState) => state.event.results.map((r) => state.event.definitions[r]));

  const groupedDefinitions = definitions.reduce((acc, def) => {
    acc[def.namespace] = acc[def.namespace] || [];
    acc[def.namespace].push(def);
    return acc;
  }, {});
  let orderedGroupNames = Object.keys(groupedDefinitions).sort((prev, next): number => {
    if (groupedDefinitions[prev][0].isCore > groupedDefinitions[next][0].isCore) {
      return 1;
    }
    if (prev > next) {
      return 1;
    }
    return -1;
  });

  orderedGroupNames = [
    ...Object.keys(groupedDefinitions).filter((g) => g === 'status-service'),
    ...Object.keys(groupedDefinitions).filter((g) => g !== 'status-service'),
  ];

  return (
    <GoAModalStyle>
      <GoAModal
        open={webhook !== undefined}
        testId={'test-webhook'}
        heading={`Test webhook - ${webhook?.name}`}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                dispatch(clearEventLogEntries());
                setShowEntries(false);
                dispatch(ResetModalState());
              }}
            >
              Close
            </GoAButton>
            <GoAButton
              type="primary"
              disabled={selectedStatusName === null}
              onClick={() => {
                dispatch(TestWebhooks(webhook, selectedStatusName));
              }}
            >
              Test
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem label="Events">
          {!orderedGroupNames && renderNoItem('event definition')}

          {events && (
            <GoARadioGroup
              name="option"
              value={selectedStatusName}
              onChange={(_, value) => setSelectedStatusName(value)}
              orientation="vertical"
              testId="status-radio-group"
            >
              {events?.map((val) => (
                <GoARadioItem name="option" value={val}></GoARadioItem>
              ))}
            </GoARadioGroup>
          )}
        </GoAFormItem>

        {(showEntries || (indicator.show && indicator.message !== 'Loading...')) && (
          <EntryDetail>
            {indicator.show ? (
              <div>
                <PageIndicator />
              </div>
            ) : (
              showEntries &&
              (entries ? (
                <JSONFont>{JSON.stringify(entries[0], null, 2)}</JSONFont>
              ) : (
                'No timely response from webhook test server - please try again'
              ))
            )}
          </EntryDetail>
        )}
      </GoAModal>
    </GoAModalStyle>
  );
};

const GoAModalStyle = styled.div`
  .group-name {
    font-size: var(--goa-font-size-5);
    font-weight: var(--fw-bold);
  }

  .margin-bottom {
    margin-bottom: 0.25rem;
  }

  .minute-button {
    border: 1px solid #666666;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    background: #f1f1f1;
    padding: 7px 12px 7px 12px;
    margin-left: -3px;
  }

  .progress-container--large {
    background: #f3f3f3;
  }
`;

export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const ErrorMsg = styled.div`
  display: inline-flex;
  color: var(--color-red);
  pointer-events: none;
  gap: 0.25rem;
`;

export const Events = styled.div`
  display: flex;
`;

export const NoPaddingTd = styled.td`
  padding: 0px !important;
`;

export const JSONFont = styled.div`
  font-family: monospace;
`;
