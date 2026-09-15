import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecipientSearchForm, SEARCH_DEBOUNCE_MS } from './recipientSearchForm';

describe('RecipientSearchForm', () => {
  const onSearch = jest.fn();
  const onReset = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    onSearch.mockReset();
    onReset.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderForm = (searchValue = '') =>
    render(<RecipientSearchForm searchValue={searchValue} onSearch={onSearch} onReset={onReset} />);

  const inputOf = (baseElement: Element) => baseElement.querySelector("goa-input[testId='recipient-search-input']");

  const type = (baseElement: Element, value: string) =>
    fireEvent(inputOf(baseElement), new CustomEvent('_change', { detail: { name: 'search', value } }));

  const settle = () => act(() => void jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

  it('searches once the typing pauses', () => {
    const { baseElement } = renderForm();

    type(baseElement, 'smith');
    expect(onSearch).not.toHaveBeenCalled();

    settle();

    expect(onSearch).toHaveBeenCalledWith('smith');
  });

  it('does not search on every keystroke', () => {
    const { baseElement } = renderForm();

    type(baseElement, 's');
    act(() => void jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS / 2));
    type(baseElement, 'sm');
    act(() => void jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS / 2));
    type(baseElement, 'smi');

    expect(onSearch).not.toHaveBeenCalled();

    settle();

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('smi');
  });

  // The component owning the search passes the committed value back down. Adopting that echo while
  // more has been typed would put the older value back in the box and lose the characters between.
  it('keeps what was typed while the search it already ran comes back down', () => {
    const { baseElement, rerender } = renderForm();

    type(baseElement, 'smi');
    settle();
    expect(onSearch).toHaveBeenCalledWith('smi');

    type(baseElement, 'smith');
    rerender(<RecipientSearchForm searchValue="smi" onSearch={onSearch} onReset={onReset} />);

    expect(inputOf(baseElement)).toHaveAttribute('value', 'smith');
  });

  it('takes up a search set from outside', () => {
    const { baseElement, rerender } = renderForm();

    rerender(<RecipientSearchForm searchValue="from-elsewhere" onSearch={onSearch} onReset={onReset} />);

    expect(inputOf(baseElement)).toHaveAttribute('value', 'from-elsewhere');
  });

  it('does not search again for a value it was handed', () => {
    renderForm('smith');

    settle();

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('searches straight away when enter is pressed', () => {
    const { baseElement } = renderForm();

    fireEvent(
      inputOf(baseElement),
      new CustomEvent('_keyPress', { detail: { name: 'search', value: 'smith', key: 'Enter' } }),
    );

    expect(onSearch).toHaveBeenCalledWith('smith');
  });

  it('does not search on any other key', () => {
    const { baseElement } = renderForm();

    fireEvent(
      inputOf(baseElement),
      new CustomEvent('_keyPress', { detail: { name: 'search', value: 'smit', key: 't' } }),
    );

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('shows the search the results are for', () => {
    const { baseElement } = renderForm('smith');

    expect(inputOf(baseElement)).toHaveAttribute('value', 'smith');
  });

  it('offers a way to clear the field only once there is something in it', () => {
    const { baseElement, rerender } = renderForm();
    expect(inputOf(baseElement)).not.toHaveAttribute('trailingicon');

    rerender(<RecipientSearchForm searchValue="smith" onSearch={onSearch} onReset={onReset} />);
    expect(inputOf(baseElement)).toHaveAttribute('trailingicon', 'close');
  });

  it('clears the field and searches for nothing', () => {
    const { baseElement } = renderForm('smith');

    fireEvent(inputOf(baseElement), new CustomEvent('_trailingIconClick'));

    expect(onSearch).toHaveBeenCalledWith('');
    expect(inputOf(baseElement)).toHaveAttribute('value', '');
  });

  it('clears the field and the search when reset', () => {
    const { baseElement } = renderForm('smith');

    fireEvent(
      baseElement.querySelector("goa-button[testId='recipient-search-reset-button']"),
      new CustomEvent('_click'),
    );

    expect(onReset).toHaveBeenCalled();
    expect(inputOf(baseElement)).toHaveAttribute('value', '');
  });
});
