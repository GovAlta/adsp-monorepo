import styles from './jsonforms-components.module.scss';

/* eslint-disable-next-line */
export interface JsonformsComponentsProps {}

export function JsonformsComponents(props: JsonformsComponentsProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to JsonformsComponents!</h1>
    </div>
  );
}

export default JsonformsComponents;
