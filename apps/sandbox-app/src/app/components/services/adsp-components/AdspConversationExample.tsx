import React, { useEffect, useMemo, useState } from 'react';
import {
  GoabButton,
  GoabContainer,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabText,
} from '@abgov/react-components';
import { ADSPConversation } from '@abgov/adsp-components-react';
import { createConversationClient } from '@abgov/adsp-components-core';
import { useSelector } from 'react-redux';
import { authenticatedUserSelector, directorySelector, getAccessToken } from '../../../state';
import { ServiceContainer } from '../../styled-components';

const COMMENT_SERVICE_ID = 'urn:ads:platform:comment-service';

interface TopicTypeItem {
  id: string;
  name?: string;
}

interface TopicTypesResponse {
  tenant?: TopicTypeItem[] | Record<string, TopicTypeItem | string>;
  core?: TopicTypeItem[] | Record<string, TopicTypeItem | string>;
}

interface TopicTypeChoice {
  value: string;
  label: string;
}

interface TopicListItem {
  id: string | number;
  resourceId: string;
  name?: string;
}

interface TopicListResponse {
  results?: TopicListItem[];
}

interface TopicRecord {
  topicId: string;
  resourceId: string;
  topicName: string;
}

export const AdspConversationExample = () => {
  const directory = useSelector(directorySelector);
  const authenticatedUser = useSelector(authenticatedUserSelector);
  const resolvedCurrentUserId = authenticatedUser?.id;
  const params = new URLSearchParams(window.location.search);
  const initialTypeId = params.get('typeId') || '';
  const initialTopicId = params.get('topicId') || '';

  const [topicTypeChoices, setTopicTypeChoices] = useState<TopicTypeChoice[]>([]);
  const [topicRecords, setTopicRecords] = useState<TopicRecord[]>([]);
  const [topicListLoading, setTopicListLoading] = useState<boolean>(false);
  const [topicListError, setTopicListError] = useState<string>();
  const [selectedTypeId, setSelectedTypeId] = useState<string>(initialTypeId);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId);

  const commentServiceBaseUrl = directory?.[COMMENT_SERVICE_ID];
  const conversationClient = useMemo(() => {
    if (!commentServiceBaseUrl) {
      return null;
    }

    return createConversationClient({
      baseUrl: commentServiceBaseUrl,
      getAccessToken,
    });
  }, [commentServiceBaseUrl]);

  const topicChoices = useMemo(
    () =>
      topicRecords
        .map((record) => ({
          value: record.topicId,
          label: record.topicName || `Topic ${record.topicId}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [topicRecords],
  );

  const selectedTopic = useMemo(
    () => topicRecords.find((record) => record.topicId === selectedTopicId),
    [selectedTopicId, topicRecords],
  );

  const resolvedResourceId = selectedTopic?.resourceId || '';
  const hasConversationTarget = !!selectedTypeId && !!selectedTopicId && !!resolvedResourceId;

  const loadTopicTypes = async () => {
    if (!commentServiceBaseUrl) {
      setTopicListError('Comment service URL is unavailable in directory.');
      return;
    }

    const normalizeTopicTypes = (
      source: TopicTypesResponse['tenant'] | TopicTypesResponse['core'],
    ): TopicTypeChoice[] => {
      if (!source) {
        return [];
      }

      if (Array.isArray(source)) {
        return source
          .filter((topicType) => !!topicType?.id)
          .map((topicType) => ({
            value: topicType.id,
            label: topicType.name?.trim() || topicType.id,
          }));
      }

      return Object.entries(source).map(([key, value]) => {
        if (typeof value === 'string') {
          return { value, label: key };
        }

        const typeId = value?.id || key;
        return {
          value: typeId,
          label: value?.name?.trim() || key || typeId,
        };
      });
    };

    try {
      setTopicListLoading(true);
      setTopicListError(undefined);

      const token = await getAccessToken();
      const topicTypesUrl = new URL('/comment/v1/topic-types', commentServiceBaseUrl);
      const topicTypesResponse = await fetch(topicTypesUrl.href, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!topicTypesResponse.ok) {
        throw new Error(`Unable to load topic types (${topicTypesResponse.status}).`);
      }

      const topicTypesData = (await topicTypesResponse.json()) as TopicTypesResponse;
      const mergedTopicTypes = [
        ...normalizeTopicTypes(topicTypesData.tenant),
        ...normalizeTopicTypes(topicTypesData.core),
      ];
      const uniqueTopicTypes = Array.from(
        new Map(mergedTopicTypes.map((topicType) => [topicType.value, topicType])).values(),
      ).sort((a, b) => a.label.localeCompare(b.label));

      setTopicTypeChoices(uniqueTopicTypes);

      if (selectedTypeId && !uniqueTopicTypes.some((topicType) => topicType.value === selectedTypeId)) {
        setSelectedTypeId('');
        setSelectedTopicId('');
        setTopicRecords([]);
      }
    } catch (err) {
      setTopicListError(err instanceof Error ? err.message : 'Unable to load topic types.');
    } finally {
      setTopicListLoading(false);
    }
  };

  const loadTopics = async (typeId: string) => {
    if (!commentServiceBaseUrl || !typeId) {
      setTopicRecords([]);
      setSelectedTopicId('');
      return;
    }

    try {
      setTopicListLoading(true);
      setTopicListError(undefined);

      const token = await getAccessToken();
      const url = new URL('/comment/v1/topics', commentServiceBaseUrl);
      url.searchParams.set('top', '100');
      url.searchParams.set('criteria', JSON.stringify({ typeIdEquals: typeId }));

      const response = await fetch(url.href, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to load topics (${response.status}).`);
      }

      const data = (await response.json()) as TopicListResponse;
      const records = (data.results || [])
        .filter((item) => !!item.resourceId)
        .map((item) => ({
          topicId: `${item.id}`,
          resourceId: item.resourceId,
          topicName: item.name?.trim() || `Topic ${item.id}`,
        }));

      const uniqueRecords = Array.from(new Map(records.map((record) => [record.topicId, record])).values());
      setTopicRecords(uniqueRecords);

      if (selectedTopicId && uniqueRecords.some((record) => record.topicId === selectedTopicId)) {
        return;
      }

      setSelectedTopicId(uniqueRecords[0]?.topicId || '');
    } catch (err) {
      setTopicListError(err instanceof Error ? err.message : 'Unable to load topics.');
      setTopicRecords([]);
      setSelectedTopicId('');
    } finally {
      setTopicListLoading(false);
    }
  };

  useEffect(() => {
    void loadTopicTypes();
    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentServiceBaseUrl]);

  useEffect(() => {
    void loadTopics(selectedTypeId);
    // loadTopics is intentionally invoked from state transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypeId, commentServiceBaseUrl]);

  useEffect(() => {
    if (!selectedTopicId) {
      return;
    }

    if (!topicChoices.some((choice) => choice.value === selectedTopicId)) {
      setSelectedTopicId(topicChoices[0]?.value || '');
    }
  }, [selectedTopicId, topicChoices]);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="adsp-conversation-container"
        heading="ADSP conversation"
      >
        <GoabText size="body-m" mb="m">
          Demo of ADSPConversation from adsp-components-react using the comment service conversation client.
        </GoabText>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
          <GoabFormItem label="Topic type" labelSize="compact">
            <GoabDropdown
              name="adsp-conversation-topic-type"
              value={selectedTypeId}
              width="100%"
              size="compact"
              onChange={(detail) => {
                setSelectedTypeId(detail.value);
                setSelectedTopicId('');
                setTopicRecords([]);
              }}
            >
              <GoabDropdownItem value="" label="Select topic type" />
              {topicTypeChoices.map(({ value, label }) => (
                <GoabDropdownItem key={value} value={value} label={label} />
              ))}
            </GoabDropdown>
          </GoabFormItem>

          <GoabFormItem label="Topic" labelSize="compact">
            <GoabDropdown
              name="adsp-conversation-topic-id"
              value={selectedTopicId}
              size="compact"
              width="100%"
              disabled={!selectedTypeId || topicChoices.length === 0}
              onChange={(detail) => setSelectedTopicId(detail.value)}
            >
              <GoabDropdownItem value="" label="Select topic" />
              {topicChoices.map(({ value, label }) => (
                <GoabDropdownItem key={value} value={value} label={label} />
              ))}
            </GoabDropdown>
          </GoabFormItem>
        </div>

        <GoabText size="body-s" mt="s" mb="m">
          Resource ID is fetched from the selected topic.
          {resolvedResourceId ? ` Current resource ID: ${resolvedResourceId}` : ''}
        </GoabText>

        <GoabButton
          type="secondary"
          size="compact"
          onClick={() => {
            void loadTopicTypes();
          }}
          testId="refresh-topic-types"
        >
          Refresh topic types and topics
        </GoabButton>

        {topicListLoading && <GoabText size="body-s">Loading topic types...</GoabText>}
        {topicListError && <GoabText size="body-s">{topicListError}</GoabText>}

        {!conversationClient || !hasConversationTarget ? (
          <GoabContainer type="non-interactive" width="full">
            <GoabText size="body-m">Select a topic type and topic to load a conversation.</GoabText>
          </GoabContainer>
        ) : (
          <ADSPConversation
            client={conversationClient}
            resourceId={resolvedResourceId}
            typeId={selectedTypeId || undefined}
            currentUserId={resolvedCurrentUserId}
            canDelete
            testId="adsp-conversation-demo"
          />
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};

export default AdspConversationExample;
