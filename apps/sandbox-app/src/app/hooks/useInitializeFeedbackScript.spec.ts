import { renderHook } from '@testing-library/react';
import { useInitializeFeedbackScript } from './useInitializeFeedbackScript';
import { useSelector } from 'react-redux';
import { getFeedbackContext } from './useFeedbackWidget';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../state', () => ({
  environmentSelector: jest.fn(),
}));

jest.mock('./useFeedbackWidget', () => ({
  DEFAULT_TENANT: 'default-tenant',
  getFeedbackContext: jest.fn(),
}));

describe('useInitializeFeedbackScript', () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.head.innerHTML = ''; // Clean up DOM
  });

  test('does not append script if environment.feedback.url is undefined', () => {
    // Arrange
    (useSelector as jest.Mock).mockReturnValue({ feedback: {} });

    // Act
    renderHook(() => useInitializeFeedbackScript());

    // Assert
    expect(document.querySelector('script')).toBeNull();
  });

  test('does not append script if script with same src already exists', () => {
    // Arrange
    const mockUrl = 'https://feedback.example.com/script.js';
    (useSelector as jest.Mock).mockReturnValue({ feedback: { url: mockUrl } });

    const existingScript = document.createElement('script');
    existingScript.src = mockUrl;
    document.head.appendChild(existingScript);

    // Act
    renderHook(() => useInitializeFeedbackScript());

    // Assert
    const scripts = document.querySelectorAll(`script[src="${mockUrl}"]`);
    expect(scripts).toHaveLength(1);
  });

  test('appends script to document head if not already present', () => {
    // Arrange
    const mockUrl = 'https://feedback.example.com/script.js';
    (useSelector as jest.Mock).mockReturnValue({ feedback: { url: mockUrl } });

    // Act
    renderHook(() => useInitializeFeedbackScript());

    // Assert
    const script = document.querySelector(`script[src="${mockUrl}"]`);
    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);
  });

  test('calls adspFeedback.initialize with correct parameters when script loads', () => {
    // Arrange
    const mockUrl = 'https://feedback.example.com/script.js';
    const mockInitialize = jest.fn();
    globalThis.adspFeedback = { initialize: mockInitialize };

    (useSelector as jest.Mock).mockReturnValue({ feedback: { url: mockUrl } });
    (getFeedbackContext as jest.Mock).mockReturnValue({ user: 'test-user' });

    // Act
    renderHook(() => useInitializeFeedbackScript('custom-tenant'));

    const script = document.querySelector(`script[src="${mockUrl}"]`);
    script?.onload?.(new Event('load'));

    // Assert
    expect(mockInitialize).toHaveBeenCalledWith({
      tenant: 'custom-tenant',
      getContext: expect.any(Function),
    });

    // Verify getContext function
    const getContext = mockInitialize.mock.calls[0][0].getContext;
    expect(getContext()).toEqual({ user: 'test-user' });
  });
});
