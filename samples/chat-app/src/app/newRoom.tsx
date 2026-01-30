import { GoabIconButton } from '@abgov/react-components';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../main';
import { setRoom } from './chat.slice';
import styles from './rooms.module.scss';

export const NewRoom = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  return (
    <li className={styles.addRoom}>
      {showAdd ? (
        <span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <GoabIconButton
            icon="close"
            size="medium"
            onClick={() => {
              setName('');
              setShowAdd(false);
            }}
          />
          <GoabIconButton
            icon="checkmark"
            size="medium"
            disabled={!name}
            onClick={() => {
              dispatch(
                setRoom({
                  id: name.toLowerCase().replace(/ /g, '-'),
                  name,
                  description: '',
                })
              );
              setName('');
              setShowAdd(false);
            }}
          />
        </span>
      ) : (
        <GoabIconButton
          icon="add-circle"
          size="medium"
          onClick={() => setShowAdd(true)}
        />
      )}
    </li>
  );
};
