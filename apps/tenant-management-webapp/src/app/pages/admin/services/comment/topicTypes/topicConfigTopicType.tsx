import React, { useState } from 'react';
import { CommentTopicTypes } from '@store/comment/model';

import { GoabIconButton } from '@abgov/react-components';

import { updateCommentTopicType } from '@store/comment/action';

import { Edit, ConfigCommentWrapper, Anchor } from '../styled-components';
import { AddEditCommentTopicType } from './addEditCommentTopicType';
import { useDispatch } from 'react-redux';

interface CommentConfigCommentProps {
  topicType: CommentTopicTypes;
}
export const TopicConfigTopicType = ({ topicType }: CommentConfigCommentProps) => {
  const { id, name } = topicType;
  const [openEditCommentTemplate, setOpenEditCommentTemplate] = useState(false);

  const dispatch = useDispatch();
  return (
    <ConfigCommentWrapper data-testid="comment-config-comment">
      <div className="nameColumn">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
            <tr>
              <td data-testid="template-name" className="overflowContainer">
                {name}
              </td>
            </tr>
          </thead>
        </table>
      </div>
      <div className="separator"></div>
      <div className="idColumn">
        <table>
          <thead>
            <tr>
              <th>Topic type ID</th>
            </tr>
            <tr>
              <td data-testid="template-id" className="overflowContainer">
                {id}
              </td>
            </tr>
          </thead>
        </table>
      </div>

      <div className="editColumn">
        <Edit>
          <Anchor rel="noopener noreferrer" onClick={() => setOpenEditCommentTemplate(true)}>
            Edit
          </Anchor>
          <GoabIconButton
            icon="create"
            testId="comment-template-incommentation-edit-icon"
            title="Edit"
            size="small"
            onClick={() => setOpenEditCommentTemplate(true)}
          />
        </Edit>
      </div>
      {openEditCommentTemplate && (
        <AddEditCommentTopicType
          open={openEditCommentTemplate}
          isEdit={true}
          onClose={() => setOpenEditCommentTemplate(false)}
          initialValue={topicType}
          onSave={(topicType) => {
            dispatch(updateCommentTopicType(topicType));
          }}
        />
      )}
    </ConfigCommentWrapper>
  );
};
