import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FILE_INIT } from '@store/file/models';
import { SESSION_INIT, FileTypeItem } from '@store/session/models';
import { FileTypes } from './fileTypes';

describe('File types tab', () => {
  const mockStore = configureStore([]);
  const fileTypes: FileTypeItem[] = [
    {
      name: 'mock-file-type-a',
      readRoles: [],
      updateRoles: ['testRoleA'],
      id: 'mock-file-type-a-id',
      anonymousRead: false,
      hasFile: true,
    },
    {
      name: 'mock-file-type-b',
      readRoles: ['testRoleB'],
      updateRoles: ['testRoleA'],
      id: 'mock-file-type-b-id',
      anonymousRead: true,
      hasFile: false,
    },
  ];
  const store = mockStore({
    fileService: {
      ...FILE_INIT,
      fileTypes,
    },
    tenant: {
      realmRoles: [
        {
          name: 'testRoleA',
          id: 'test-role-a-id',
        },
        {
          name: 'testRoleB',
          id: 'test-role-b-id',
        },
      ],
    },
    session: SESSION_INIT,
  });

  it('render file types', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <FileTypes />
      </Provider>
    );

    const addFileTypeButton = queryByTestId('add-file-type-btn');
    expect(addFileTypeButton).not.toBeNull();
    const fileTypeTable = queryByTestId('file-types-table');
    expect(fileTypeTable).not.toBeNull();
  });

  it('render add file type', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <FileTypes />
      </Provider>
    );

    const addFileTypeButton = queryByTestId('add-file-type-btn');
    fireEvent.click(addFileTypeButton);
    const fileTypeModal = queryByTestId('file-type-modal');
    expect(fileTypeModal).not.toBeNull();
    const nameInput = queryByTestId('file-type-modal-name-input');
    expect(nameInput).not.toBeNull();
  });

  it('check file type table actions', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <FileTypes />
      </Provider>
    );

    const editActionBtn = queryByTestId('file-type-row-edit-btn-mock-file-type-b-id');
    fireEvent.click(editActionBtn);
    const fileTypeModal = queryByTestId('file-type-modal');
    expect(fileTypeModal).not.toBeNull();
    const nameInput = queryByTestId('file-type-modal-name-input');
    nameInput.textContent.includes('testRoleA');
    const cancelBtn = queryByTestId('file-type-modal-cancel');
    fireEvent.click(cancelBtn);
    const deleteActionBtnA = queryByTestId('file-type-row-delete-btn-mock-file-type-a-id');
    fireEvent.click(deleteActionBtnA);
    const deleteModalTitle = queryByTestId('file-type-delete-modal-title');
    deleteModalTitle.textContent.includes('Delete file type');
  });
});
