import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DetailsLayout } from './DetailsLayout';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLayout = (props: Partial<React.ComponentProps<typeof DetailsLayout>> = {}) =>
  render(
    <MemoryRouter>
      <DetailsLayout initialized={true} header={<h2>Header</h2>} {...props}>
        <div>Body</div>
      </DetailsLayout>
    </MemoryRouter>,
  );

describe('DetailsLayout', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders the header, children and actions when initialized', () => {
    renderLayout({ actionsForm: <div>Actions</div> });
    expect(screen.getByText('Header')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
    expect(screen.getByText('Actions')).toBeTruthy();
  });

  it('hides the children while not initialized', () => {
    renderLayout({ initialized: false });
    expect(screen.queryByText('Body')).toBeNull();
  });

  it('navigates back on Back', () => {
    renderLayout();
    fireEvent(screen.getByText('Back'), new CustomEvent('_click'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows Next only with nextTo and navigates to it', () => {
    const { unmount } = renderLayout();
    expect(screen.queryByText('Next')).toBeNull();
    unmount();
    renderLayout({ nextTo: '/next' });
    fireEvent(screen.getByText('Next'), new CustomEvent('_click'));
    expect(mockNavigate).toHaveBeenCalledWith('/next');
  });
});
