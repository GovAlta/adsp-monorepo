import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { getCommentTopicTypes, fetchTopicsRequest, addTopicRequest, deleteTopicRequest } from '@store/comment/action';

import { renderNoItem } from '@components/NoItem';
import {
  GoAButton,
  GoACircularProgress,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoASkeleton,
} from '@abgov/react-components-new';
import { TopicModal } from './topicModal';
import { ButtonPadding, ProgressWrapper } from '../styled-components';
import { TopicListTable } from './topicsTable';
import { LoadMoreWrapper } from '@components/styled-components';

interface VisibleProps {
  visible: boolean;
}

const Visible = styled.div<VisibleProps>`
  visibility: ${(props) => `${props.visible ? 'visible' : 'hidden'}`};
`;

export const TopicsList = (): JSX.Element => {
  const dispatch = useDispatch();
  const [openAddTopic, setOpenAddTopic] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedType, setSelectedType] = useState('');
  //const [spinner, setSpinner] = useState(false);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const topicTypes = useSelector((state: RootState) => {
    return state?.comment?.topicTypes;
  });
  const next = useSelector((state: RootState) => state.comment.nextEntries);
  const topics = useSelector((state: RootState) => state.comment.topics);
  const [topicList, setTopicList] = useState({});

  useEffect(() => {
    dispatch(getCommentTopicTypes());
  }, []);

  useEffect(() => {
    if (selectedType) {
      dispatch(fetchTopicsRequest(topicTypes[selectedType]));
    }
  }, [selectedType, topicList]);

  const onNext = () => {
    dispatch(fetchTopicsRequest(topicTypes[selectedType], next));
  };

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [openAddTopic]);

  const reset = () => {
    setOpenAddTopic(false);
  };

  const handleSave = (topic) => {
    setTopicList(topic);
    dispatch(addTopicRequest(topic));
  };

  return (
    <section>
      {!indicator.show && Object.keys(topicTypes).length === 0 && renderNoItem('Topic types')}
      {Object.keys(topicTypes).length > 0 && (
        <GoAFormItem label="Select a topic type">
          {indicator.show && Object.keys(topicTypes).length === 0 && <GoASkeleton type="text" key={1}></GoASkeleton>}
          {Object.keys(topicTypes).length > 0 && (
            <GoADropdown
              name="TopicTypes"
              value={selectedType}
              onChange={(name: string, selectedType: string) => {
                // setSpinner(true);
                setSelectedType(selectedType);
              }}
              aria-label="select-comment-topictype-dropdown"
              width="100%"
              testId="comment-select-topictype-dropdown"
            >
              {Object.keys(topicTypes).map((item) => (
                <GoADropdownItem
                  name="TopicTypes"
                  key={item}
                  label={item}
                  value={item}
                  testId={`${item}-get-comment-options`}
                />
              ))}
            </GoADropdown>
          )}
        </GoAFormItem>
      )}
      <div>
        <ButtonPadding>
          <GoAButton
            testId="add-topic-btn"
            onClick={() => {
              setModalType('new');
              setOpenAddTopic(true);
            }}
          >
            Add topic
          </GoAButton>
        </ButtonPadding>
      </div>
      {!next && indicator.show && (
        <ProgressWrapper>
          <GoACircularProgress visible={indicator.show} size="small" />
        </ProgressWrapper>
      )}
      {!indicator.show && selectedType !== '' && topics && Object.keys(topics).length === 0 && renderNoItem('topics')}
      {!indicator.show && selectedType !== '' && topics && Object.keys(topics).length !== 0 && (
        <Visible visible={true}>
          {
            <TopicListTable
              topics={topics}
              onDeleteTopic={(topicSelected) => {
                dispatch(deleteTopicRequest(topicSelected.id));
              }}
            />
          }
          {next && (
            <LoadMoreWrapper>
              <GoAButton testId="comment-load-more-btn" key="comment-load-more-btn" type="tertiary" onClick={onNext}>
                Load more
              </GoAButton>
            </LoadMoreWrapper>
          )}
        </Visible>
      )}
      {openAddTopic && (
        <TopicModal
          open={openAddTopic}
          topicType={selectedType}
          type={modalType}
          onCancel={() => {
            reset();
          }}
          onSave={handleSave}
        />
      )}
    </section>
  );
};
