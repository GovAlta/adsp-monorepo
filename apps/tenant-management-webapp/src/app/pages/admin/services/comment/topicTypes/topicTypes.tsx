import React, { useEffect, useState } from 'react';

import { GoAButton } from '@abgov/react-components-new';

import { useDispatch, useSelector } from 'react-redux';
import { getCommentTopicTypes, updateCommentTopicType, deleteCommentTopicType } from '@store/comment/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { CommentTopicTypesTable } from './definitionsList';
import { PageIndicator } from '@components/Indicator';
import { defaultCommentTopicType } from '@store/comment/model';

import { DeleteModal } from '@components/DeleteModal';
import { AddEditCommentTopicType } from './addEditCommentTopicType';
import { BodyGlobalStyles } from '../../styled-components';

interface CommentTopicTypesProps {
  openAddTopicTypes: boolean;
}
export const CommentTopicTypes = ({ openAddTopicTypes }: CommentTopicTypesProps) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState(defaultCommentTopicType);

  const commentTopicTypes = useSelector((state: RootState) => {
    return Object.entries(state?.comment?.topicTypes)
      .sort((template1, template2) => {
        return template1[1].name.localeCompare(template2[1].name);
      })
      .reduce((tempObj, [commentDefinitionId, commentDefinitionData]) => {
        tempObj[commentDefinitionId] = commentDefinitionData;
        return tempObj;
      }, {});
  });

  const [openAddCommentTopicType, setOpenAddCommentTopicType] = useState(false);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (openAddTopicTypes) {
      setOpenAddCommentTopicType(true);
    }
  }, [openAddTopicTypes]);

  useEffect(() => {
    dispatch(getCommentTopicTypes());
  }, []);

  const reset = () => {
    setOpenAddCommentTopicType(false);
  };

  // eslint-disable-next-line
  useEffect(() => {}, [commentTopicTypes]);

  return (
    <>
      <div>
        <br />
        {/* <BodyGlobalStyles hideOverflow={false} /> */}
        <GoAButton
          testId="add-topic-type"
          onClick={() => {
            setOpenAddCommentTopicType(true);
          }}
        >
          Add topic type
        </GoAButton>
        <br />
        <br />
        <PageIndicator />

        <AddEditCommentTopicType
          open={openAddCommentTopicType}
          isEdit={false}
          onClose={reset}
          initialValue={defaultCommentTopicType}
          onSave={(definition) => {
            dispatch(updateCommentTopicType(definition));
          }}
        />

        {!indicator.show && Object.keys(commentTopicTypes).length === 0 && renderNoItem('topic types')}
        {!indicator.show && Object.keys(commentTopicTypes).length > 0 && (
          <CommentTopicTypesTable
            topicTypes={commentTopicTypes}
            onDelete={(currentTemplate) => {
              setShowDeleteConfirmation(true);
              setCurrentDefinition(currentTemplate);
            }}
          />
        )}

        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete topic type"
          content={
            <div>
              Are you sure you wish to delete <b>{`${currentDefinition?.name}?`}</b>
            </div>
          }
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(deleteCommentTopicType(currentDefinition?.id));
          }}
        />
      </div>
    </>
  );
};
