import React, { FunctionComponent, useState } from 'react';

import { GoAButton, GoAButtonGroup, GoAFormItem, GoAIcon, GoAModal, GoATextArea } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { Comment, TopicItem, defaultComment } from '@store/comment/model';
import { badCharsCheck, wordMaxLengthCheck, isNotEmptyCheck, Validator } from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';
import { RootState } from '@store/index';
import { DescriptionItem, HelpText, ErrorMsg } from '../styled-components';
interface TopicModalProps {
  topic: TopicItem;
  open: boolean;
  type: string;
  onCancel?: () => void;
  onSave: (comment: Comment) => void;
}

export const AddCommentModal: FunctionComponent<TopicModalProps> = ({
  topic,
  open,
  type,
  onCancel,
  onSave,
}: TopicModalProps): JSX.Element => {
  const isNew = type === 'new';

  const [comment, setComment] = useState<Comment>(defaultComment);
  const descErrMessage = 'Comment can not be over 180 characters';
  const title = isNew ? 'Add comment' : 'Edit comment';
  const namespaceCheck = (): Validator => {
    return (namespace: string) => {
      return namespace === 'platform' ? 'Cannot use the word platform as namespace' : '';
    };
  };

  // const [showAddComment, setShowAddComment] = useState(false);
  // const indicator = useSelector((state: RootState) => {
  //   return state?.session?.indicator;
  // });

  const { errors, validators } = useValidators(
    'content',
    'content',
    badCharsCheck,
    namespaceCheck(),
    wordMaxLengthCheck(32, 'Comment'),
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
      testId="add-comment-modal"
      open={open}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="comment-modal-cancel"
            onClick={() => {
              validators.clear();
              // setComment(comment);
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
              name="commentcontent"
              value={comment?.content}
              width="100%"
              testId="content"
              aria-label="content"
              onChange={(name, value) => {
                validators.remove('content');
                validators['content'].check(value);
                setComment({ ...comment, content: value });
              }}
            />

            <HelpText>
              {comment?.content?.length <= 180 ? (
                <div> {descErrMessage} </div>
              ) : (
                <ErrorMsg>
                  <GoAIcon type="warning" size="small" theme="filled" />
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
