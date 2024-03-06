import React, { useEffect, useState } from 'react';
import DataTable from '@components/DataTable';
import { TopicTableItem } from './topicTableItem';
import { TopicItem } from '@store/comment/model';

import { HeaderFont, TableDiv } from '../styled-components';

import { useDispatch } from 'react-redux';
import { clearComments } from '@store/comment/action';

export interface TopicTableProps {
  topics: TopicItem[];
  selectedType: string;
  showActions: boolean;
  onDeleteTopic?: (Topic) => void;
}

export const TopicListTable = ({ topics, selectedType, showActions, onDeleteTopic }: TopicTableProps): JSX.Element => {
  const dispatch = useDispatch();
  const newTopics = topics ? (JSON.parse(JSON.stringify(topics)) as Record<string, TopicItem[]>) : [];
  const [activeRow, setActiveRow] = useState(null);
  useEffect(() => {
    dispatch(clearComments());
  }, [activeRow, dispatch]);
  return (
    <>
      <HeaderFont>
        <label>Topic list</label>
      </HeaderFont>
      <TableDiv>
        <DataTable data-testid="topic-table">
          <thead data-testid="topic-table-header">
            <tr>
              <th data-testid="topic-table-header-topic-name">Topic name</th>
              <th data-testid="topic-table-header-resource-id">Resource ID</th>
              <th data-testid="topic-table-header-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(newTopics).map((topic) => {
              return (
                <TopicTableItem
                  key={topic}
                  selectedType={selectedType}
                  showActions={showActions}
                  id={newTopics[topic]['id']}
                  topic={newTopics[topic]}
                  onDeleteTopic={onDeleteTopic}
                  showDetails={activeRow === newTopics[topic]['id']}
                  onToggleDetails={() => {
                    dispatch(clearComments());
                    setActiveRow(activeRow === newTopics[topic]['id'] ? null : newTopics[topic]['id']);
                  }}
                />
              );
            })}
          </tbody>
        </DataTable>
      </TableDiv>
    </>
  );
};
