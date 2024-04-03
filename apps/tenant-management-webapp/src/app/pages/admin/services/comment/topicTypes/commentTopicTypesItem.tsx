import React from 'react';
import { CommentTopicTypes } from '@store/comment/model';
import { useNavigate } from 'react-router-dom';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface PdfTemplateItemProps {
  commentTopicType: CommentTopicTypes;
  onDelete: (CommentTopicType) => void;
}

export const CommentTopicTypesItem = ({ commentTopicType, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const navigate = useNavigate();
  return (
    <tr>
      <td data-testid="comment-topic-types-name">{commentTopicType.name}</td>
      <td data-testid="comment-topic-types-template-id">{commentTopicType.id}</td>

      <td data-testid="comment-topic-types-security-classification" style={{ textTransform: 'capitalize' }}>
        {commentTopicType.securityClassification}
      </td>
      <td data-testid="comment-topic-types-action">
        <GoAContextMenu>
          <GoAContextMenuIcon
            testId="comment-topic-types-edit"
            title="Edit"
            type="create"
            onClick={() => navigate(`edit/${commentTopicType.id}`)}
          />
          <GoAContextMenuIcon
            testId={`comment-topic-types-delete`}
            title="Delete"
            type="trash"
            onClick={() => onDelete(commentTopicType)}
          />
        </GoAContextMenu>
      </td>
    </tr>
  );
};
