import { useDispatch, useSelector } from 'react-redux';
import styles from './room.module.scss';
import { fetchMessages, selectedRoomSelector } from './chat.slice';
import { Compose } from './compose';
import { Messages } from './messages';
import { Paging } from './paging';
import { RoomLabel } from './roomLabel';
import { useEffect } from 'react';
import { AppDispatch } from '../main';

export const Room = () => {
  const room = useSelector(selectedRoomSelector);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (room && !room.set?.messagesLoaded) {
      dispatch(
        fetchMessages({
          roomId: room.id,
          top: room.set.top,
          after: room.set.next,
        })
      );
    }
  }, [dispatch, room]);

  return room ? (
    <div className={styles.room}>
      <RoomLabel key={room.id} room={room} />
      <div className={styles.messages}>
        <Messages />
        <Paging room={room} />
      </div>
      <div className={styles.message}>
        <Compose roomId={room?.id} />
      </div>
    </div>
  ) : (
    <div className={styles.room}></div>
  );
};
