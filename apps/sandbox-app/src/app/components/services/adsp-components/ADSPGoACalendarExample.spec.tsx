import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ADSPGoACalendarExample } from './ADSPGoACalendarExample';
import { calendarsBusySelector, calendarsSelector, directorySelector, loadCalendars } from '../../../state';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../state', () => ({
  directorySelector: jest.fn(),
  calendarsSelector: jest.fn(),
  calendarsBusySelector: jest.fn(),
  getAccessToken: jest.fn(),
  loadCalendars: jest.fn((args) => ({ type: 'loadCalendars', payload: args })),
}));

jest.mock('@abgov/adsp-components-react', () => ({
  ADSPCalendar: (props: { testId?: string }) => <div data-testid={props.testId} />,
  AdspThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockState = (directory: Record<string, string>) =>
  (useSelector as jest.Mock).mockImplementation((selector) => {
    if (selector === directorySelector) return directory;
    if (selector === calendarsSelector) return [{ name: 'holidays', displayName: 'Holidays' }];
    if (selector === calendarsBusySelector) return { loading: false };
    return undefined;
  });

describe('ADSPGoACalendarExample', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  test('says the calendar service is unavailable and loads nothing without a directory URL', () => {
    // Arrange
    mockState({});

    // Act
    render(<ADSPGoACalendarExample tenantName="autotest" />);

    // Assert
    expect(
      screen.getByText('Calendar service is not available in the directory for this environment.'),
    ).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('loads the tenant calendars when the calendar service is available', () => {
    // Arrange
    mockState({ 'urn:ads:platform:calendar-service': 'https://calendar-service.test' });

    // Act
    render(<ADSPGoACalendarExample tenantName="autotest" />);

    // Assert
    expect(loadCalendars).toHaveBeenCalledWith({ tenantName: 'autotest' });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  test('does not render the calendar until one is loaded', () => {
    // Arrange
    mockState({ 'urn:ads:platform:calendar-service': 'https://calendar-service.test' });

    // Act
    render(<ADSPGoACalendarExample tenantName="autotest" />);

    // Assert
    expect(screen.queryByTestId('goa-calendar')).not.toBeInTheDocument();
  });
});
