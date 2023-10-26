import React, { FC, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TestWebhooks } from '@store/status/actions';
import { Webhooks } from '@store/status/models';
import { EventSearchCriteria } from '@store/event/models';
import { getEventLogEntries } from '@store/event/actions';
import {
  GoAButton,
  GoAButtonGroup,
  GoARadioItem,
  GoARadioGroup,
  GoAModal,
  GoAFormItem,
} from '@abgov/react-components-new';
import { GoAPageLoader } from '@abgov/react-components';

import { renderNoItem } from '@components/NoItem';
import styled from 'styled-components';

import { RootState } from '@store/index';

interface Props {
  isOpen: boolean;
  title: string;
  testId: string;

  defaultWebhooks: Webhooks;
  onClose?: () => void;
}

export const TestWebhookModal: FC<Props> = ({ isOpen, title, onClose, testId, defaultWebhooks }: Props) => {
  const dispatch = useDispatch();

  const [showEntries, setShowEntries] = useState<boolean>(false);
  const [selectedStatusName, setSelectedStatusName] = useState<string>(
    defaultWebhooks && defaultWebhooks.eventTypes[0].id.split(':')[1]
  );

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const webhook = defaultWebhooks;

  const initCriteria: EventSearchCriteria = {
    name: 'webhook-triggered',
    namespace: 'push-service',
    timestampMax: '',
    timestampMin: '',
    url: webhook?.url,
    applications: webhook?.targetId,
    value: webhook?.targetId,
    top: 1,
  };

  const entries = useSelector((state: RootState) => state.event.entries);
  const testSuccess = useSelector((state: RootState) => state.serviceStatus.testSuccess);

  useEffect(() => {
    if (testSuccess) {
      dispatch(getEventLogEntries('', initCriteria));
      setShowEntries(true);
    }
  }, [testSuccess]);

  useEffect(() => {
    setShowEntries(false);
  }, [isOpen]);

  const test = async (eventName: string) => {
    dispatch(TestWebhooks(webhook, eventName));
  };

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

  const events = webhook?.eventTypes.map((e) => e.id.split(':')[1]);

  return (
    <GoAModalStyle>
      <GoAModal
        open={isOpen}
        testId={testId}
        heading={`${title} - ${webhook?.name}`}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                onClose();
              }}
            >
              Close
            </GoAButton>
            <GoAButton type="primary" onClick={() => test(selectedStatusName)}>
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
              <div className="loading-border">
                <GoAPageLoader visible={true} type="infinite" message={indicator.message} pagelock={true} />
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
    font-size: var(--fs-lg);
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

  .loading-border {
    margin-top: 75px;
  }

  .progress-container--large {
    background: #f3f3f3;
  }
`;

export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const HelpText = styled.div`
  font-size: var(--fs-sm);
  color: var(--color-gray-900);
  line-height: calc(var(--fs-sm) + 0.5rem);
  display: flex;
  display-direction: row;
  justify-content: space-between;
  margin-top: 2px;
`;

export const ErrorMsg = styled.div`
   {
    display: inline-flex;
    color: var(--color-red);
    pointer-events: none;
    gap: 0.25rem;
  }
`;

export const Events = styled.div`
   {
    display: flex;
  }
`;

export const NoPaddingTd = styled.td`
  padding: 0px !important;
`;

export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 12px;
  padding: 16px;
  margin-bottom: 4px;
  text-align: left;
  min-height: 320px;
`;

export const JSONFont = styled.div`
  font-family: monospace;
`;
