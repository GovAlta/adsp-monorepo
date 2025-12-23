import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FILE_INIT } from '@store/file/models';
import { SESSION_INIT } from '@store/session/models';
import { FileTypeItem } from '@store/file/models';
import { FileTypes } from './fileTypes';
import { MemoryRouter } from 'react-router-dom';

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
      anonymousRead: false,
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
    const { queryByTestId, baseElement } = render(
      <Provider store={store}>
        <MemoryRouter>
          <FileTypes activeEdit={true} openAddFileType={false} />
        </MemoryRouter>
      </Provider>
    );

    const addFileTypeButton = baseElement.querySelector("goa-button[testId='add-file-type-btn']");
    expect(addFileTypeButton).not.toBeNull();
    const fileTypeTable = queryByTestId('file-types-table');
    expect(fileTypeTable).not.toBeNull();
  });

  it('render add file type', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <MemoryRouter>
          <FileTypes activeEdit={true} openAddFileType={false} />
        </MemoryRouter>
      </Provider>
    );

    const addFileTypeButton = baseElement.querySelector("goa-button[testId='add-file-type-btn']");
    fireEvent(addFileTypeButton, new CustomEvent('_click'));
    const fileTypeModal = baseElement.querySelector('goa-modal');

    expect(fileTypeModal).not.toBeNull();

    const nameInput = baseElement.querySelector("[testid='file-type-modal-name-input']");
    expect(nameInput).not.toBeNull();
  });

  it('check file type table actions', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <MemoryRouter>
          <FileTypes activeEdit={true} openAddFileType={false} />
        </MemoryRouter>
      </Provider>
    );

    const editActionBtn = baseElement.querySelector(
      "goa-icon-button[testId='file-type-row-edit-btn-mock-file-type-b-id']"
    );
    fireEvent(editActionBtn, new CustomEvent('_click'));
    const fileTypeModal = baseElement.querySelector('goa-modal');
    expect(fileTypeModal).not.toBeNull();
    const nameInput = baseElement.querySelector("[testid='file-type-modal-name-input']");
    nameInput.textContent.includes('testRoleA');
    const actionContent = fileTypeModal.querySelector("[slot='actions']");

    const cancelBtn = actionContent.querySelector("[testid='file-type-modal-cancel']");
    fireEvent(cancelBtn, new CustomEvent('_click'));
    const deleteActionBtnA = baseElement.querySelector(
      "goa-icon-button[testId='file-type-row-delete-btn-mock-file-type-a-id']"
    );

    fireEvent(deleteActionBtnA, new CustomEvent('_click'));
    const deleteModal = baseElement.querySelector("[testid='delete-confirmation']");
    expect(deleteModal).not.toBeNull();
  });
});
