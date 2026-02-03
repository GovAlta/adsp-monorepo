import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserState } from 'redux-oidc';
import { AppDispatch } from '../main';
import styles from './chat.module.scss';
import { ChatState, connectStream, fetchRooms } from './chat.slice';
import { ConnectLabel } from './connectLabel';
import { Room } from './room';
import { Rooms } from './rooms';

export const Chat: FunctionComponent = () => {
  const user = useSelector((state: { user: UserState }) => state.user.user);
  const error = useSelector((state: { chat: ChatState }) => state.chat.error);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (user?.access_token) {
      dispatch(fetchRooms(user.access_token));
      dispatch(connectStream(user.access_token));
    }
  });
  return (
    <main className={styles.chat}>
      <div className={styles.rooms}>
        <Rooms />
        <ConnectLabel />
      </div>
      <Room />
      {!user && (
        <div className={styles.overlay}>
          <p>Sign in to get chatting...</p>
        </div>
      )}
      {user && error && (
        <div className={styles.overlay}>
          <p>{error}</p>
        </div>
      )}
    </main>
  );
};
