import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { TagSearchFilter } from './TagSearchFilter';
import { getTags } from '../state';

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    getTags: jest.fn((payload) => ({ type: 'directory/get-tags', payload })),
  };
});

const mockStore = configureStore();

const createState = (tags: Record<string, { value: string; label: string }> = {}) => ({
  directory: {
    resources: {},
    tags,
    resourceTags: {},
    tagResources: {},
    results: [],
    next: null,
    busy: { loading: false, loadingResourceTags: {}, executing: false },
  },
});

const renderFilter = (props: Partial<Parameters<typeof TagSearchFilter>[0]> = {}, state = createState()) => {
  const store = mockStore(state);
  const view = render(
    <Provider store={store}>
      <TagSearchFilter value={null} onChange={jest.fn()} {...props} />
    </Provider>,
  );

  return { store, ...view };
};

describe('TagSearchFilter', () => {
  beforeEach(() => {
    (getTags as unknown as jest.Mock).mockClear();
  });

  it('should load the tags to filter by when none are held yet', () => {
    renderFilter();

    expect(getTags).toHaveBeenCalledWith({});
  });

  it('should not reload tags it already holds', () => {
    renderFilter({}, createState({ urgent: { value: 'urgent', label: 'Urgent' } }));

    expect(getTags).not.toHaveBeenCalled();
  });

  it('should offer every tag alongside the option to filter by none', () => {
    const { baseElement } = renderFilter(
      {},
      createState({
        urgent: { value: 'urgent', label: 'Urgent' },
        howard: { value: 'howard', label: 'Howard' },
      }),
    );

    const options = Array.from(baseElement.querySelectorAll('goa-dropdown-item')).map((item) =>
      item.getAttribute('value'),
    );
    expect(options).toEqual(['', 'howard', 'urgent']);
  });

  // Changing the filter mid-search would leave a tag on screen that the results were not filtered
  // by, so the listing disables it while a search runs.
  it('should be disabled when asked', () => {
    const { baseElement } = renderFilter({ disabled: true });

    expect(baseElement.querySelector("goa-dropdown[name='tag']").getAttribute('disabled')).toBe('true');
  });

  it('should be enabled by default', () => {
    const { baseElement } = renderFilter();

    expect(baseElement.querySelector("goa-dropdown[name='tag']").getAttribute('disabled')).toBeFalsy();
  });
});
