import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Tab, Tabs } from './Tabs';

describe('Tabs', () => {
  const renderTabs = (props: Partial<React.ComponentProps<typeof Tabs>> = {}, showSecond = true) =>
    render(
      <Tabs {...props}>
        <Tab label="Overview" testId="overview">
          <div data-testid="overview-content" />
        </Tab>
        {showSecond ? (
          <Tab label="Solutions">
            <div data-testid="solutions-content" />
          </Tab>
        ) : null}
        <Tab label="Patterns">
          <div data-testid="patterns-content" />
        </Tab>
      </Tabs>,
    );

  it('shows a button for each tab with its label', () => {
    const { getByText } = renderTabs();

    expect(getByText('Overview')).toBeTruthy();
    expect(getByText('Solutions')).toBeTruthy();
    expect(getByText('Patterns')).toBeTruthy();
  });

  it('shows only the first tab by default', () => {
    const { getByTestId, queryByTestId } = renderTabs();

    expect(getByTestId('overview-content')).toBeTruthy();
    expect(queryByTestId('solutions-content')).toBeNull();
  });

  it('shows the tab at activeIndex', () => {
    const { getByTestId, queryByTestId } = renderTabs({ activeIndex: 2 });

    expect(getByTestId('patterns-content')).toBeTruthy();
    expect(queryByTestId('overview-content')).toBeNull();
  });

  it('switches to a clicked tab and reports its index', () => {
    const changeTabCallback = jest.fn();
    const { getByTestId, queryByTestId } = renderTabs({ changeTabCallback });

    fireEvent.click(getByTestId('tab-btn-1'));

    expect(getByTestId('solutions-content')).toBeTruthy();
    expect(queryByTestId('overview-content')).toBeNull();
    expect(changeTabCallback).toHaveBeenCalledWith(1);
  });

  it('follows a new activeIndex from its parent', () => {
    const view = renderTabs({ activeIndex: 0 });

    view.rerender(
      <Tabs activeIndex={1}>
        <Tab label="Overview">
          <div data-testid="overview-content" />
        </Tab>
        <Tab label="Solutions">
          <div data-testid="solutions-content" />
        </Tab>
      </Tabs>,
    );

    expect(view.getByTestId('solutions-content')).toBeTruthy();
  });

  it('leaves out tabs that render null and numbers the rest in order', () => {
    const { getByTestId, queryByText } = renderTabs({}, false);

    fireEvent.click(getByTestId('tab-btn-1'));

    expect(queryByText('Solutions')).toBeNull();
    expect(getByTestId('patterns-content')).toBeTruthy();
  });

  it("uses a tab's testId for its button", () => {
    const { getByTestId } = renderTabs();

    expect(getByTestId('overview-tab-btn').textContent).toBe('Overview');
  });

  it('shows actions beside the tabs', () => {
    const { getByText } = renderTabs({ actions: <button>Add</button> });

    expect(getByText('Add')).toBeTruthy();
  });
});
