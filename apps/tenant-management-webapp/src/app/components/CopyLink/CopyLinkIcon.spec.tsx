import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import CopyLinkIcon, { COPIED_DISPLAY_MS } from './CopyLinkIcon';

const LINK = 'https://form-admin.example.com/my-tenant';

describe('CopyLinkIcon', () => {
  const writeText = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    writeText.mockReset();
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderIcon = () => {
    const result = render(<CopyLinkIcon label="Form admin app link" link={LINK} testId="copy-icon" />);
    const button = () => result.baseElement.querySelector("goa-icon-button[testid='copy-icon']");
    return { ...result, button };
  };

  const click = async (element: Element) => {
    await act(async () => {
      fireEvent(element, new CustomEvent('_click'));
    });
  };

  it('renders the label with a copy icon', () => {
    const { getByText, button } = renderIcon();
    expect(getByText('Form admin app link')).toBeInTheDocument();
    expect(button()).toHaveAttribute('icon', 'copy');
  });

  it('copies the link and shows a checkmark for about 5 seconds', async () => {
    writeText.mockResolvedValue(undefined);
    const { button } = renderIcon();

    await click(button());

    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(button()).toHaveAttribute('icon', 'checkmark');

    act(() => {
      jest.advanceTimersByTime(COPIED_DISPLAY_MS - 1);
    });
    expect(button()).toHaveAttribute('icon', 'checkmark');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(button()).toHaveAttribute('icon', 'copy');
  });

  it('keeps the copy icon when the clipboard write fails', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const { button } = renderIcon();

    await click(button());

    expect(button()).toHaveAttribute('icon', 'copy');
  });
});
