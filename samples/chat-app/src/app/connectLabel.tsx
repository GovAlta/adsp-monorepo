import { GoabBadge } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { ChatState } from './chat.slice';
import styles from './connectLabel.module.scss';

export const ConnectLabel: FunctionComponent = () => {
  const connected = useSelector(
    (state: { chat: ChatState }) => state.chat.connected
  );
  return (
    <div className={styles.connect}>
      {connected ? (
        <GoabBadge type="success" content="Connected" />
      ) : (
        <GoabBadge type="information" content="Not connected" />
      )}
    </div>
  );
};
