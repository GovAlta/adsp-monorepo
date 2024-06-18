import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { CommentCoreTopicTypesItem } from './commentCoreTopicTypesItem';
import { CommentTopicTypes } from '@store/comment/model';

export interface CommentTemplatesTableProps {
  topicTypes: Record<string, CommentTopicTypes>;
  onDelete?: (CommentTemplate) => void;
  onEdit?: (CommentTemplate) => void;
}
export const CommentCoreTopicTypesTable: FunctionComponent<CommentTemplatesTableProps> = ({ topicTypes, onDelete }) => {
  const newTemplates = JSON.parse(JSON.stringify(topicTypes));

  return (
    <DataTable data-testid="comment-core-topic-types-table">
      <thead data-testid="comment-core-topic-types-table-header">
        <tr>
          <th data-testid="comment-core-topic-types-table-header-name">Name</th>
          <th id="comment-core-topic-types-template-id" data-testid="comment-core-topic-types-table-header-template-id">
            Topic type ID
          </th>
          <th
            id="comment-core-topic-types-assessor"
            data-testid="comment-core-topic-types-table-header-security-classification"
          >
            Security classification
          </th>
          <th data-testid="comment-core-topic-types-table-header-action">Action</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(newTemplates).map((templateName) => {
          return (
            <CommentCoreTopicTypesItem
              key={templateName}
              commentTopicType={newTemplates[templateName]}
              onDelete={onDelete}
            />
          );
        })}
      </tbody>
    </DataTable>
  );
};
