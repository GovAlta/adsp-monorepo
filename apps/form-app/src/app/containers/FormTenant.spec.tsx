import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// The container reads the store through plain selectors, so feeding them a state object is enough
// and avoids standing up the real store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockState: any;
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: (state: any) => unknown) => selector(mockState),
  useDispatch: () => mockDispatch,
}));

// The routed content and the feedback widget are not what these tests are about.
jest.mock('./FormDefinition', () => ({ FormDefinition: () => <div /> }));
jest.mock('./Forms', () => ({ Forms: () => <div /> }));
jest.mock('./FeedbackNotification', () => ({ FeedbackNotification: () => <div /> }));
jest.mock('../util/feedbackUtils', () => ({ useFeedbackLinkHandler: () => undefined }));

const { FormTenant } = require('./FormTenant');

const TOPIC = { resourceId: 'urn:form-1', id: 12, name: 'form-1', commenters: [] };

const stateWith = ({ supportTopic = false, topic = null, unread = 0, show = false } = {}) => ({
  config: { initialized: true },
  user: {
    initialized: true,
    user: { id: 'applicant', name: 'Roy Styan' },
    tenant: { id: 'urn:tenant', name: 'autotest' },
  },
  form: {
    selected: 'abc111232',
    definitions: { abc111232: { id: 'abc111232', name: 'abc111232', supportTopic } },
    form: null,
  },
  comment: {
    topics: topic ? { [topic.resourceId]: topic } : {},
    selected: { resourceId: topic?.resourceId ?? null },
    messages: { show, unread, latestCommentId: 0, lastReadCommentId: 0 },
  },
});

const renderTenant = () =>
  render(
    <MemoryRouter initialEntries={['/autotest/abc111232']}>
      <FormTenant />
    </MemoryRouter>,
  );

describe('FormTenant', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('shows the form name in the header', () => {
    mockState = stateWith();

    const { getByTestId } = renderTenant();

    expect(getByTestId('form-header-name')).toHaveTextContent('abc111232');
  });

  // The support topic checkbox on the definition is what makes questions available at all.
  it('does not offer messages when the definition has no support topic', () => {
    mockState = stateWith({ supportTopic: false, topic: TOPIC });

    const { container } = renderTenant();

    expect(container.querySelector('goa-button[testid="form-messages-toggle"]')).toBeNull();
  });

  // Until a form is loaded there is no topic, so there would be nothing for the drawer to show.
  it('does not offer messages before the form has a topic', () => {
    mockState = stateWith({ supportTopic: true, topic: null });

    const { container } = renderTenant();

    expect(container.querySelector('goa-button[testid="form-messages-toggle"]')).toBeNull();
  });

  it('offers messages with the unread count once there is a topic', () => {
    mockState = stateWith({ supportTopic: true, topic: TOPIC, unread: 2 });

    const { container } = renderTenant();

    expect(container.querySelector('goa-button[testid="form-messages-toggle"]')).toHaveTextContent('Messages (2)');
  });

  it('opens the drawer when messages is clicked', () => {
    mockState = stateWith({ supportTopic: true, topic: TOPIC, show: false });

    const { container } = renderTenant();
    // Mount dispatches its own initialization, so only what the click causes is of interest.
    mockDispatch.mockClear();
    fireEvent(container.querySelector('goa-button[testid="form-messages-toggle"]'), new CustomEvent('_click'));

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
