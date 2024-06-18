import React, { useState } from 'react';
import { CommentTopicTypes } from '@store/comment/model';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { Gap, RolesContainer, RolesWrap } from '../styled-components';

interface PdfTemplateItemProps {
  commentTopicType: CommentTopicTypes;
  onDelete: (CommentTopicType) => void;
}

export const CommentCoreTopicTypesItem = ({ commentTopicType, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const [showCoreRoles, setShowCoreRoles] = useState<boolean>(false);
  return (
    <>
      <tr>
        <td data-testid="comment-topic-types-name">{commentTopicType.name}</td>
        <td data-testid="comment-topic-types-template-id">{commentTopicType.id}</td>

        <td data-testid="comment-topic-types-security-classification" style={{ textTransform: 'capitalize' }}>
          {commentTopicType.securityClassification}
        </td>
        <td className="actionCol">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showCoreRoles ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => {
                setShowCoreRoles(!showCoreRoles);
              }}
              testId="toggle-details-visibility"
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showCoreRoles && (
        <tr>
          <td
            colSpan={4}
            style={{
              padding: '0',
            }}
          >
            <RolesContainer>
              {commentTopicType.adminRoles.length > 0 && (
                <>
                  <RolesWrap>
                    Admin :{' '}
                    {commentTopicType.adminRoles.map((role): JSX.Element => {
                      return <span>{role} </span>;
                    })}
                  </RolesWrap>
                  <Gap></Gap>
                </>
              )}
              {commentTopicType.commenterRoles.length > 0 && (
                <>
                  <RolesWrap>
                    Commenter :{' '}
                    {commentTopicType.commenterRoles?.map((role): JSX.Element => {
                      return <span>{role} </span>;
                    })}
                  </RolesWrap>
                  <Gap></Gap>
                </>
              )}
              {commentTopicType.readerRoles.length > 0 && (
                <RolesWrap>
                  Reader :{' '}
                  {commentTopicType.readerRoles?.map((role): JSX.Element => {
                    return <span>{role} </span>;
                  })}
                </RolesWrap>
              )}
            </RolesContainer>
          </td>
        </tr>
      )}
    </>
  );
};
