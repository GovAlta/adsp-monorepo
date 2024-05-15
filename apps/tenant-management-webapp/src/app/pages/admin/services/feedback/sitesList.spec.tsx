import React from 'react';
import { Provider } from 'react-redux';
import { render, fireEvent, screen, getAllByAltText, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import configureStore from 'redux-mock-store';
import { SitesList } from './sitesList';
import { FeedbackSite } from '@store/feedback/models';

const mockStore = configureStore([]);
const sites: FeedbackSite[] = [
  { url: 'https://example.com', allowAnonymous: true, views: [] },
  { url: 'https://second-site.com', allowAnonymous: false, views: [] },
];
const store = mockStore({
  feedback: { sites },
});

describe('SitesListComponent', () => {
  const onEditMock = jest.fn();
  const onDeleteMock = jest.fn();

  it('renders without errors', () => {
    render(
      <Provider store={store}>
        <SitesList onEdit={onEditMock} onDelete={onDeleteMock} />
      </Provider>
    );
  });

  it('displays empty state message when there are no feedback sites', () => {
    const emptyStore = mockStore({ feedback: { sites: [] } });
    const renderer = render(
      <Provider store={emptyStore}>
        <SitesList onEdit={onEditMock} onDelete={onDeleteMock} />
      </Provider>
    );

    expect(renderer.getByText('No feedback sites found')).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    render(
      <Provider store={store}>
        <SitesList onEdit={onEditMock} onDelete={onDeleteMock} />
      </Provider>
    );

    expect(screen.getByTestId('feedbacks-sites-table-header-name')).toHaveTextContent('Site');
    expect(screen.getByText('Allow Anonymous')).toBeInTheDocument();
  });

  it('lists feedback sites in the table', () => {
    render(
      <Provider store={store}>
        <SitesList onEdit={onEditMock} onDelete={onDeleteMock} />
      </Provider>
    );

    const rows = screen.getAllByTestId('site');
    expect(rows.length).toBe(2);
    expect(rows[0]).toHaveTextContent('https://example.com');
    expect(rows[1]).toHaveTextContent('https://second-site.com');
  });
  it('lists feedback sites in the table', () => {
    render(
      <Provider store={store}>
        <SitesList onEdit={onEditMock} onDelete={onDeleteMock} />
      </Provider>
    );

    const editButtons = screen.getAllByTestId('site-edit');
    expect(editButtons).toHaveLength(2);
  });
});
