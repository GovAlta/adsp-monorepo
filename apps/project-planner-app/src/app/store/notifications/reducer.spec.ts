import { notificationsReducer } from './reducer';
import { DismissNotification, ErrorNotification, SuccessNotification } from './actions';
import { MessageType } from './models';

describe('notificationsReducer', () => {
  const empty = { notifications: [] };

  it('adds an error notification', () => {
    const state = notificationsReducer(empty, ErrorNotification({ message: 'Failed' }));

    expect(state.notifications).toEqual([expect.objectContaining({ message: 'Failed', type: MessageType.error })]);
  });

  it('adds a success notification', () => {
    const state = notificationsReducer(empty, SuccessNotification({ message: 'Saved' }));

    expect(state.notifications).toEqual([expect.objectContaining({ message: 'Saved', type: MessageType.success })]);
  });

  it('removes a dismissed notification', () => {
    const shown = notificationsReducer(empty, ErrorNotification({ message: 'Failed' }));

    const state = notificationsReducer(shown, DismissNotification(shown.notifications[0]));

    expect(state.notifications).toEqual([]);
  });
});
