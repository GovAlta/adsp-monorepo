import { handleFeedbackClick } from './feedbackUtils';

describe('handleFeedbackClick', () => {
  let mockEvent: MouseEvent;

  beforeEach(() => {
    mockEvent = {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent;

    // Reset the global window.adspFeedback object before each test
    (window as any).adspFeedback = undefined;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('prevents the default link behavior', () => {
    // Arrange
    (window as any).adspFeedback = { openFeedbackForm: jest.fn() };

    // Act
    handleFeedbackClick(mockEvent);

    // Assert
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  test('calls openFeedbackForm when adspFeedback and openFeedbackForm are defined', () => {
    // Arrange
    const openFeedbackFormMock = jest.fn();
    (window as any).adspFeedback = { openFeedbackForm: openFeedbackFormMock };

    // Act
    handleFeedbackClick(mockEvent);

    // Assert
    expect(openFeedbackFormMock).toHaveBeenCalled();
  });

  test('logs an error when adspFeedback is not defined', () => {
    // Arrange
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Act
    handleFeedbackClick(mockEvent);

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith('adspFeedback is not defined or openFeedbackForm is missing.');

    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  test('logs an error when openFeedbackForm is missing from adspFeedback', () => {
    // Arrange
    (window as any).adspFeedback = {}; // adspFeedback exists but openFeedbackForm is missing
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Act
    handleFeedbackClick(mockEvent);

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith('adspFeedback is not defined or openFeedbackForm is missing.');

    // Cleanup
    consoleErrorSpy.mockRestore();
  });
});