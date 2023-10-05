import React from 'react';
import { CommentTopicTypes } from '@store/comment/model';
import { OverflowWrap } from '../styled-components';

import { useRouteMatch } from 'react-router';
import { GoABadge } from '@abgov/react-components-new';
import { useHistory } from 'react-router-dom';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface PdfTemplateItemProps {
  commentTopicType: CommentTopicTypes;
  onDelete: (CommentTopicType) => void;
}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const CommentTopicTypesItem = ({ commentTopicType, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const { url } = useRouteMatch();

  const history = useHistory();
  return (
    <>
      <tr>
        <td data-testid="comment-topic-types-name">{commentTopicType.name}</td>
        <td data-testid="comment-topic-types-template-id">{commentTopicType.id}</td>

        <td data-testid="comment-topic-types-applicant">
          <OverflowWrap>
            {commentTopicType.adminRoles?.map((role): JSX.Element => {
              return (
                <div key={`applicant-roles-${role}`}>
                  <GoABadge key={`applicant-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
          </OverflowWrap>
        </td>
        <td data-testid="comment-topic-types-clerk">
          <OverflowWrap>
            {commentTopicType.commenterRoles?.map((role): JSX.Element => {
              return (
                <div key={`applicant-roles-${role}`}>
                  <GoABadge key={`applicant-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
          </OverflowWrap>
        </td>
        <td data-testid="comment-topic-types-assessor">
          <OverflowWrap>
            {commentTopicType.readerRoles?.map((role): JSX.Element => {
              return (
                <div key={`applicant-roles-${role}`}>
                  <GoABadge key={`applicant-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
          </OverflowWrap>
        </td>
        <td data-testid="comment-topic-types-security-classification">
          {capitalizeFirstLetter(commentTopicType.securityClassification)}
        </td>
        <td data-testid="comment-topic-types-action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              testId="comment-definition-edit"
              title="Edit"
              type="create"
              onClick={() => history.push(`${url}/edit/${commentTopicType.id}`)}
            />
            <GoAContextMenuIcon
              testId={`comment-definition-delete`}
              title="Delete"
              type="trash"
              onClick={() => onDelete(commentTopicType)}
            />
          </GoAContextMenu>
        </td>
      </tr>
    </>
  );
};
