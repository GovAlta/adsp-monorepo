import { renderHook } from '@testing-library/react';
import { useFeedbackWidget, getFeedbackContext, resolveFeedbackTenant } from './useFeedbackWidget';

describe('useFeedbackWidget', () => {
  const mockInitialize = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.adspFeedback = { initialize: mockInitialize };
    document.body.innerHTML = '<div class="adsp-fb-badge"></div>';
    window.history.pushState({}, '', '/');
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
      designSystemsVersion: '2.0',
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

  test('does not call initialize without a tenant context', () => {
    // Act
    renderHook(() => useFeedbackWidget());

    // Assert
    expect(mockInitialize).not.toHaveBeenCalled();
  });

  test('initializes feedback widget with tenant from the route', () => {
    // Arrange
    window.history.pushState({}, '', '/route-tenant/services');

    // Act
    renderHook(() => useFeedbackWidget());

    // Assert
    expect(mockInitialize).toHaveBeenCalledWith({
      tenant: 'route-tenant',
      getContext: expect.any(Function),
      designSystemsVersion: '2.0',
    });
  });

  test('sets data-show="true" on the badge element on mount', () => {
    // Act
    renderHook(() => useFeedbackWidget('test-tenant'));

    // Assert
    const badge = document.querySelector('.adsp-fb-badge') as HTMLElement;
    expect(badge.getAttribute('data-show')).toBe('true');
  });

  test('sets data-show="false" on the badge element on unmount', () => {
    // Act
    const { unmount } = renderHook(() => useFeedbackWidget('test-tenant'));
    unmount();

    // Assert
    const badge = document.querySelector('.adsp-fb-badge') as HTMLElement;
    expect(badge.getAttribute('data-show')).toBe('false');
  });
});

describe('resolveFeedbackTenant', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  test('returns trimmed tenant name when provided', () => {
    expect(resolveFeedbackTenant(' custom-tenant ')).toBe('custom-tenant');
  });

  test('returns tenant from the current route when tenant name is not provided', () => {
    window.history.pushState({}, '', '/route-tenant/services/form');

    expect(resolveFeedbackTenant()).toBe('route-tenant');
  });

  test('returns an empty string when no tenant context exists', () => {
    expect(resolveFeedbackTenant()).toBe('');
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
