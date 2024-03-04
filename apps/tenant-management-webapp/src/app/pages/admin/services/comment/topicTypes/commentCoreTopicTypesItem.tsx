import React from 'react';
import { CommentTopicTypes } from '@store/comment/model';

interface PdfTemplateItemProps {
  commentTopicType: CommentTopicTypes;
  onDelete: (CommentTopicType) => void;
}

export const CommentCoreTopicTypesItem = ({ commentTopicType, onDelete }: PdfTemplateItemProps): JSX.Element => {
  return (
      <tr>
        <td data-testid="comment-topic-types-name">{commentTopicType.name}</td>
        <td data-testid="comment-topic-types-template-id">{commentTopicType.id}</td>

        <td data-testid="comment-topic-types-security-classification" style={{ textTransform: 'capitalize' }}>
          {commentTopicType.securityClassification}
        </td>
      </tr>
  );
};
