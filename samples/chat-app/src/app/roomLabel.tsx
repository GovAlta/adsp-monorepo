import { GoabIconButton } from '@abgov/react-components';
import { FunctionComponent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../main';
import { isAdminSelector, Room, setRoom } from './chat.slice';
import styles from './roomLabel.module.scss';

interface RoomLabelProps {
  room: Room;
}

export const RoomLabel: FunctionComponent<RoomLabelProps> = ({ room }) => {
  const isAdmin = useSelector(isAdminSelector);
  const [edit, setEdit] = useState(false);
  const [description, setDescription] = useState(room.description);
  const dispatch = useDispatch<AppDispatch>();

  return room ? (
    <div className={styles.roomLabel}>
      <div>
        <b>{room.name}</b>
      </div>
      <div>
        {edit ? (
          <>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <GoabIconButton 
              icon="close"
              size="medium"
              onClick={() => {
                setDescription(room.description);
                setEdit(false);
              }}
            />
            <GoabIconButton
              icon="checkmark"
              size="medium"
              onClick={() => {
                dispatch(
                  setRoom({ id: room.id, name: room.name, description })
                );
                setEdit(false);
              }}
            />
          </>
        ) : (
          <>
            <span>
              {description || <i>( Edit to set description )</i>}
            </span>
            {isAdmin && (
              <GoabIconButton
                icon="create"
                size="medium"
                onClick={() => setEdit(true)}
              />
            )}
          </>
        )}
      </div>
    </div>
  ) : null;
};
