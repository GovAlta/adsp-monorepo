import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, fireEvent, screen } from '@testing-library/react';
import { PdfTemplateItem } from './templateListItem';
import { MemoryRouter } from 'react-router-dom';
import { PdfTemplatesTable } from './templatesList';

describe('Test Pdf list page', () => {
  const mockStore = configureStore([]);
  const templateMock = {
    additionalStyles: '<div>Shared CSS</div>',
    description: 'mock PDF template',
    startWithDefault: true,
    footer: '<div>Footer</div>',
    header: '<div>Header</div>',
    name: 'mock-template',
    template: '<div>Main body</div>',
  };
  it('Can create list item', async () => {
    const store = mockStore({});
    // eslint-disable-next-line
    const onDeleteMock = jest.fn(() => {});
    const { queryByTestId } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com']}>
          <PdfTemplateItem pdfTemplate={templateMock} onDelete={onDeleteMock} />
        </MemoryRouter>
      </Provider>
    );

    const deleteBtn = await queryByTestId('pdf-template-delete');
    fireEvent(deleteBtn, new CustomEvent('_click'));

    expect(onDeleteMock).toHaveBeenCalledWith(templateMock);
    onDeleteMock.mockClear();
    expect(screen.queryByText(templateMock.name)).toBeDefined();
  });

  it('Can create template table', async () => {
    // eslint-disable-next-line
    const onDeleteMock = jest.fn(() => {});
    const templates = {
      'mock-template': templateMock,
    };

    const store = mockStore({});

    const { queryByTestId } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com']}>
          <PdfTemplatesTable templates={templates} onDelete={onDeleteMock} />
        </MemoryRouter>
      </Provider>
    );

    const pdfTemplateTable = await queryByTestId('pdf-templates-table');
    expect(pdfTemplateTable).toBeDefined();
    expect('Template ID').toBeDefined();
    expect('Description').toBeDefined();
    expect('Actions').toBeDefined();
  });
});
