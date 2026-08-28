import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';

import NoticeModal from './noticeModal';
import { SAVE_NOTICE_ACTION } from '@store/notice/actions';

describe('NoticeModal', () => {
  const mockStore = configureStore([]);

  // The notice being edited starts at midnight on Aug 19 and ends at noon on Aug 27, local time.
  const notice = {
    id: '1',
    message: 'howard-test',
    tennantServRef: [{ id: '99', name: 'Autotest' }],
    startDate: new Date(2026, 7, 19, 0, 0).toISOString(),
    endDate: new Date(2026, 7, 27, 12, 0).toISOString(),
    isAllApplications: false,
  };

  const createStore = () =>
    mockStore({
      serviceStatus: {
        applications: [{ appKey: '99', name: 'Autotest', monitorOnly: false }],
      },
      notice: { notices: [notice] },
    });

  const modal = (store, isOpen: boolean, noticeId?: string) => (
    <Provider store={store}>
      <NoticeModal title={noticeId ? 'Edit notice' : 'Add notice'} isOpen={isOpen} noticeId={noticeId} />
    </Provider>
  );

  const renderModal = (store, noticeId?: string) => render(modal(store, true, noticeId));

  const changeValue = (baseElement: Element, selector: string, value: string) => {
    const element = baseElement.querySelector(selector);
    fireEvent(element, new CustomEvent('_change', { detail: { value } }));
  };

  const savedNotice = (store) => store.getActions().find((action) => action.type === SAVE_NOTICE_ACTION)?.payload;

  it('saves the dates that were entered', () => {
    const store = createStore();
    const { baseElement } = renderModal(store);

    changeValue(baseElement, "goa-textarea[testId='notice-form-description']", 'howard-test');
    changeValue(baseElement, "goa-dropdown[testId='application-dropdown-list']", 'Autotest');
    changeValue(baseElement, "goa-input[testId='notice-form-start-date-picker']", '2026-08-20');
    changeValue(baseElement, "goa-input[testId='notice-form-start-time']", '00:00');
    changeValue(baseElement, "goa-input[testId='notice-form-end-date-picker']", '2026-08-27');

    fireEvent(baseElement.querySelector("goa-button[data-testid='notice-form-submit']"), new CustomEvent('_click'));

    const saved = savedNotice(store);
    expect(saved.startDate.getDate()).toBe(20);
    expect(saved.startDate.getHours()).toBe(0);
    expect(saved.endDate.getDate()).toBe(27);
  });

  it('shows the local dates of the notice being edited', () => {
    const { baseElement } = renderModal(createStore(), notice.id);

    expect(baseElement.querySelector("goa-input[testId='notice-form-start-date-picker']").getAttribute('value')).toBe(
      '2026-08-19'
    );
    expect(baseElement.querySelector("goa-input[testId='notice-form-end-date-picker']").getAttribute('value')).toBe(
      '2026-08-27'
    );
  });

  it('clears the form when the add notice modal is reopened', () => {
    const store = createStore();
    const { baseElement, rerender } = renderModal(store);

    changeValue(baseElement, "goa-textarea[testId='notice-form-description']", 'howard-test');
    changeValue(baseElement, "goa-dropdown[testId='application-dropdown-list']", 'Autotest');

    rerender(modal(store, false));
    rerender(modal(store, true));

    expect(baseElement.querySelector("goa-textarea[testId='notice-form-description']").getAttribute('value')).toBe('');
    expect(baseElement.querySelector("goa-dropdown[testId='application-dropdown-list']").getAttribute('value')).toBe(
      ''
    );
  });

  it('saves the dates that were changed on an existing notice', () => {
    const store = createStore();
    const { baseElement } = renderModal(store, notice.id);

    changeValue(baseElement, "goa-input[testId='notice-form-start-date-picker']", '2026-08-10');
    changeValue(baseElement, "goa-input[testId='notice-form-end-date-picker']", '2026-08-22');

    fireEvent(baseElement.querySelector("goa-button[data-testid='notice-form-submit']"), new CustomEvent('_click'));

    const saved = savedNotice(store);
    expect(saved.id).toBe(notice.id);
    expect(saved.startDate.getDate()).toBe(10);
    expect(saved.endDate.getDate()).toBe(22);
  });
});
