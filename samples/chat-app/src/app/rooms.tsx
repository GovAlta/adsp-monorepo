import { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../main';
import {
  ChatState,
  isAdminSelector,
  roomListSelector,
  selectRoom,
} from './chat.slice';
import { NewRoom } from './newRoom';
import styles from './rooms.module.scss';

export const Rooms: FunctionComponent = () => {
  const rooms = useSelector(roomListSelector);
  const selectedRoom = useSelector(
    (state: { chat: ChatState }) => state.chat.selectedRoom
  );
  const isAdmin = useSelector(isAdminSelector);
  const dispatch = useDispatch<AppDispatch>();
  return (
    <ul className={styles.rooms}>
      {rooms.map((room) => (
        <li
          key={room.id}
          data-selected={selectedRoom === room.id}
          onClick={() => {
            if (selectedRoom !== room.id) {
              dispatch(selectRoom(room.id));
            }
          }}
        >
          {room.name}
        </li>
      ))}
      {isAdmin && <NewRoom />}
    </ul>
  );
};
