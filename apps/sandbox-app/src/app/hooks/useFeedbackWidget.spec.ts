import { renderHook } from '@testing-library/react';
import { useFeedbackWidget, getFeedbackContext, DEFAULT_TENANT } from './useFeedbackWidget';

describe('useFeedbackWidget', () => {
  const mockInitialize = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.adspFeedback = { initialize: mockInitialize };
    document.body.innerHTML = '<div class="adsp-fb-badge"></div>';
  });

  afterEach(() => {
    delete globalThis.adspFeedback;
    document.body.innerHTML = '';
  });

  test('initializes feedback widget with provided tenant name', () => {
    // Arrange
    const tenantName = 'custom-tenant';

    // Act
    renderHook(() => useFeedbackWidget(tenantName));

    // Assert
    expect(mockInitialize).toHaveBeenCalledWith({
      tenant: tenantName,
      getContext: expect.any(Function),
    });
  });

  test('initializes feedback widget with DEFAULT_TENANT when no tenant name is provided', () => {
    // Act
    renderHook(() => useFeedbackWidget());

    // Assert
    expect(mockInitialize).toHaveBeenCalledWith({
      tenant: DEFAULT_TENANT,
      getContext: expect.any(Function),
    });
  });

  test('does not call initialize if adspFeedback is not defined', () => {
    // Arrange
    delete globalThis.adspFeedback;

    // Act
    renderHook(() => useFeedbackWidget('test-tenant'));

    // Assert
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  test('sets data-show="true" on the badge element on mount', () => {
    // Act
    renderHook(() => useFeedbackWidget());

    // Assert
    const badge = document.querySelector('.adsp-fb-badge') as HTMLElement;
    expect(badge.getAttribute('data-show')).toBe('true');
  });

  test('sets data-show="false" on the badge element on unmount', () => {
    // Act
    const { unmount } = renderHook(() => useFeedbackWidget());
    unmount();

    // Assert
    const badge = document.querySelector('.adsp-fb-badge') as HTMLElement;
    expect(badge.getAttribute('data-show')).toBe('false');
  });
});

describe('getFeedbackContext', () => {
  test('returns site and view from document.location', async () => {
    // Arrange — jsdom sets location to http://localhost/
    const expectedSite = `${document.location.protocol}//${document.location.host}`;
    const expectedView = document.location.pathname;

    // Act
    const context = await getFeedbackContext();

    // Assert
    expect(context).toEqual({
      site: expectedSite,
      view: expectedView,
    });
  });
});
