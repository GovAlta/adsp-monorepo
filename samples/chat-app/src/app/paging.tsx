import { FunctionComponent } from 'react';
import { GoabButton } from '@abgov/react-components';
import {
  ChatState,
  fetchMessages,
  Room,
} from './chat.slice';
import { useDispatch, useSelector } from 'react-redux';
import styles from './paging.module.scss';
import { AppDispatch } from '../main';

interface PagingProps {
  room: Room;
}

export const Paging: FunctionComponent<PagingProps> = ({ room }) => {
  const isLoading = useSelector(
    (state: { chat: ChatState }) =>
      state.chat.loadingStatus['messages'] === 'loading'
  );
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className={styles.paging}>
      {room?.set?.next && (
        <GoabButton
          disabled={isLoading}
          type="secondary"
          onClick={() => {
            dispatch(
              fetchMessages({
                roomId: room.id,
                top: room.set.top,
                after: room.set.next,
              })
            );
            console.log('loading More...');
          }}
        >
          Load more
        </GoabButton>
      )}
    </div>
  );
};
