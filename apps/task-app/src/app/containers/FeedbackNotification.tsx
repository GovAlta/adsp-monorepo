import { GoANotification } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { errorSelector, taskActions } from '../state';

export const FeedbackNotification = () => {
  const dispatch = useDispatch();
  const error = useSelector(errorSelector);

  return (
    error && (
      <GoANotification
        key={error.id}
        type={error.level === 'error' ? 'emergency' : 'important'}
        onDismiss={() => dispatch(taskActions.dismissError())}
      >
        {error.message}
      </GoANotification>
    )
  );
};
