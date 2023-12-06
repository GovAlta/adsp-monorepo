import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { TopicTableItem } from './topicTableItem';
import { TopicItem } from '@store/comment/model';

import { HeaderFont, TableDiv } from '../styled-components';

export interface TopicTableProps {
  topics: TopicItem[];
  onDeleteTopic?: (Topic) => void;
}

export const TopicListTable = ({ topics, onDeleteTopic }: TopicTableProps): JSX.Element => {
  const newTopics = topics ? (JSON.parse(JSON.stringify(topics)) as Record<string, TopicItem[]>) : [];

  return (
    <>
      <HeaderFont>
        <label>Topic list</label>
      </HeaderFont>
      <TableDiv>
        <DataTable data-testid="topic-table">
          <thead data-testid="topic-table-header">
            <tr>
              <th data-testid="topic-table-header-topicname">Topic name</th>
              <th data-testid="topic-table-header-resourceid">Resource ID</th>
              <th data-testid="topic-table-header-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(newTopics).map((topic) => {
              return <TopicTableItem key={topic} id={topic} topic={newTopics[topic]} onDeleteTopic={onDeleteTopic} />;
            })}
          </tbody>
        </DataTable>
      </TableDiv>
    </>
  );
};
