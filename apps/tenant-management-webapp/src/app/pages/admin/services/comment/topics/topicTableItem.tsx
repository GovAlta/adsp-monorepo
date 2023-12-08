import React, { FunctionComponent } from 'react';
import { IconDiv, MoreDetails } from '../styled-components';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { TopicItem } from '@store/comment/model';
import { CommentListTable } from '../comments/commentsTable';

interface TopicTableItemProps {
  id: string;
  topic: TopicItem;
  showDetails: boolean;
  onDeleteTopic?: (Topic) => void;
  onToggleDetails: () => void;
}

export const TopicTableItem: FunctionComponent<TopicTableItemProps> = ({
  id,
  topic,
  showDetails,
  onDeleteTopic,
  onToggleDetails,
}: TopicTableItemProps) => {
  return (
    <>
      <tr>
        <td data-testid="topic-list-namespace">{topic.name}</td>
        <td data-testid="topic-list-name">{topic.resourceId}</td>
        <td data-testid="topic-list-action">
          <IconDiv>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={onToggleDetails}
              testId="toggle-details-visibility"
            />
            <GoAContextMenuIcon
              testId="topic-definition-edit"
              title="Delete"
              type="trash"
              onClick={() => onDeleteTopic(topic)}
            />
          </IconDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: '0px',
            }}
          >
            <MoreDetails>
              <p>Topic description</p>
              <span>{topic.description}</span>
              <CommentListTable topic={topic}></CommentListTable>
            </MoreDetails>
          </td>
        </tr>
      )}
    </>
  );
};
