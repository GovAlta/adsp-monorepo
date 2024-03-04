
import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { CommentTopicTypesItem } from './commentTopicTypesItem';
import { CommentTopicTypes } from '@store/comment/model';

export interface CommentTemplatesTableProps {
  topicTypes: Record<string, CommentTopicTypes>;
  onDelete?: (CommentTemplate) => void;
  onEdit?: (CommentTemplate) => void;
}
export const CommentTopicTypesTable: FunctionComponent<CommentTemplatesTableProps> = ({ topicTypes, onDelete }) => {
  const newTemplates = JSON.parse(JSON.stringify(topicTypes));

  return (
      <DataTable data-testid="comment-topic-types-table">
        <thead data-testid="comment-topic-types-table-header">
          <tr>
            <th data-testid="comment-topic-types-table-header-name">Name</th>
            <th id="comment-topic-types-template-id" data-testid="comment-topic-types-table-header-template-id">
              Topic type ID
            </th>
            <th
              id="comment-topic-types-assessor"
              data-testid="comment-topic-types-table-header-security-classification"
            >
              Security classification
            </th>
            <th id="comment-topic-types-action" data-testid="comment-topic-types-table-header-action">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(newTemplates).map((templateName) => {
            return (
              <CommentTopicTypesItem
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
