import { GoabButton } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../main';
import { MessageContent, sendMessage } from './chat.slice';
import styles from './compose.module.scss';

interface ComposeFilePreview {
  file: File;
}
const ComposeFilePreview: FunctionComponent<ComposeFilePreview> = ({
  file,
}) => {
  const [fileUrl, setFileUrl] = useState<string>();
  useEffect(() => {
    let reader: FileReader;
    if (file) {
      reader = new FileReader();
      reader.onload = () => {
        setFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    return () => reader?.abort();
  }, [file]);
  return <img alt={file.name} src={fileUrl} />;
};

interface ComposeProps {
  roomId: string;
}

export const Compose: FunctionComponent<ComposeProps> = ({ roomId }) => {
  const [draft, setDraft] = useState<MessageContent>(['']);
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div className={styles.compose}>
      <div className={styles.composeContent}>
        {draft.map((item, idx) => {
          if (typeof item === 'string') {
            return idx + 1 === draft.length ? (
              <textarea
                key={idx}
                value={item}
                onChange={(e) => {
                  const update = [...draft];
                  update.splice(idx, 1, e.target.value);
                  setDraft(update);
                }}
              />
            ) : (
              <p key={idx}>{item}</p>
            );
          } else {
            return item.file ? <ComposeFilePreview key={idx} file={item.file} /> : null;
          }
        })}
      </div>
      <div className={styles.composeActions}>
        <input
          type="file"
          multiple={false}
          accept="image/gif, image/jpeg, image/png"
          onChange={(e) => {
            if (!e.target.files?.length) return;
            const update = [...draft];
            if (!update[update.length - 1]) {
              update.pop();
            }
            update.push(
              {
                file: e.target.files[0],
                filename: e.target.files[0].name,
              },
              ''
            );
            setDraft(update);
          }}
        />
        <GoabButton type="secondary" onClick={() => setDraft([''])}>
          Clear
        </GoabButton>
        <GoabButton
          disabled={!draft.filter((item) => !!item).length}
          onClick={() => {
            setDraft(['']);
            dispatch(sendMessage({ message: draft }));
          }}
        >
          Send
        </GoabButton>
      </div>
      {!roomId && <div className={styles.overlay} />}
    </div>
  );
};
