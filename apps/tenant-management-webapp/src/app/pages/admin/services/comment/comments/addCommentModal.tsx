import React, { useState } from 'react';

import { GoAButton, GoAButtonGroup, GoAFormItem, GoAIcon, GoAModal, GoATextArea } from '@abgov/react-components';

import { Comment, TopicItem, defaultComment } from '@store/comment/model';
import { wordMaxLengthCheck, isNotEmptyCheck } from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';

import { DescriptionItem, ErrorMsg } from '../styled-components';
import { HelpText } from '../../styled-components';

interface TopicModalProps {
  topic: TopicItem;
  selComment: Comment;
  open: boolean;
  type: string;
  onCancel?: () => void;
  onSave: (comment: Comment) => void;
}

export const AddCommentModal = ({ topic, selComment, open, type, onCancel, onSave }: TopicModalProps): JSX.Element => {
  const isNew = type === 'new';

  const [comment, setComment] = useState<Comment>(selComment ? selComment : defaultComment);
  const descErrMessage = 'Comment can not be over 180 characters';
  const title = isNew ? 'Add comment' : 'Edit comment';

  const { errors, validators } = useValidators(
    'content',
    'content',
    wordMaxLengthCheck(180, 'Comment'),
    isNotEmptyCheck('comment')
  ).build();

  const validationCheck = () => {
    const validations = {
      content: comment?.content,
    };
    if (!validators.checkAll(validations)) {
      return;
    }
    onSave(comment);
    onCancel();
    validators.clear();
  };

  return (
    <GoAModal
      heading={title}
      testId={`${isNew ? 'add' : 'edit'}-comment-modal`}
      open={open}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="comment-modal-cancel"
            onClick={() => {
              validators.clear();

              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="comment-modal-save"
            disabled={!comment?.content || validators.haveErrors()}
            onClick={() => {
              validationCheck();
              setComment(comment);
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <div>
        <GoAFormItem label="Comment">
          <DescriptionItem>
            <GoATextArea
              name="commentContent"
              value={comment.content}
              width="100%"
              testId="content"
              aria-label="content"
              onKeyPress={(name, value, key) => {
                validators.remove('content');
                validators['content'].check(value);
                setComment({ ...comment, content: value });
              }}
              // eslint-disable-next-line
              onChange={(name, value) => {}}
            />

            <HelpText>
              {comment?.content?.length <= 180 ? (
                <div> {descErrMessage} </div>
              ) : (
                <ErrorMsg>
                  <GoAIcon type="warning" size="small" theme="filled" ariaLabel="warning" />
                  {`  ${errors?.['content']}`}
                </ErrorMsg>
              )}
              <div>{`${comment?.content?.length}/180`}</div>
            </HelpText>
          </DescriptionItem>
        </GoAFormItem>
      </div>
    </GoAModal>
  );
};
