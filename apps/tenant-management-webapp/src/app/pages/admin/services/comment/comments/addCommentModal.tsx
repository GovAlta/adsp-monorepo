import React, { useState } from 'react';

import { GoabButton, GoabButtonGroup, GoabFormItem, GoabModal, GoabTextArea } from '@abgov/react-components';

import { Comment, TopicItem, defaultComment } from '@store/comment/model';
import { wordMaxLengthCheck, isNotEmptyCheck } from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';

import { DescriptionItem } from '../styled-components';
import { HelpTextComponent } from '@components/HelpTextComponent';
import { GoabTextAreaOnKeyPressDetail, GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
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
    <GoabModal
      heading={title}
      testId={`${isNew ? 'add' : 'edit'}-comment-modal`}
      open={open}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="comment-modal-cancel"
            onClick={() => {
              validators.clear();

              onCancel();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="comment-modal-save"
            disabled={!comment?.content || validators.haveErrors()}
            onClick={() => {
              validationCheck();
              setComment(comment);
            }}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <div>
        <GoabFormItem label="Comment">
          <DescriptionItem>
            <GoabTextArea
              name="commentContent"
              value={comment.content}
              width="100%"
              testId="content"
              aria-label="content"
              onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
                validators.remove('content');
                validators['content'].check(detail.value);
                setComment({ ...comment, content: detail.value });
              }}
              // eslint-disable-next-line
              onChange={(detail: GoabTextAreaOnChangeDetail) => {}}
            />
            <HelpTextComponent
              length={comment?.content?.length || 0}
              maxLength={180}
              descErrMessage={descErrMessage}
              errorMsg={errors?.['content']}
            />
          </DescriptionItem>
        </GoabFormItem>
      </div>
    </GoabModal>
  );
};
