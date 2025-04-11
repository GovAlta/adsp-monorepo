import React, { Children, ReactNode, useState, useEffect } from 'react';
import styled from 'styled-components';

/**
 *
 * @example
 *  <Tabs>
 *    <Tab label="Assets">Assets Content</Tab>
 *    <Tab label="Settings">Settings Content</Tab>
 *    <Tab label="Info">Info Content</Tab>
 *  </Tabs>
 */

interface TabsProps {
  activeIndex?: number;
  children: ReactNode;
  style?: React.CSSProperties;
  changeTabCallback?: (index: number) => void;
}

function Tabs(props: TabsProps): JSX.Element {
  const [activeTabIndex, setActiveTabIndex] = useState(props.activeIndex ?? 0);

  function selectTab(index: number) {
    setActiveTabIndex(index);
    if (typeof props.changeTabCallback === 'function') {
      props.changeTabCallback(index);
    }
  }

  useEffect(() => {
    if (props.activeIndex !== null) setActiveTabIndex(props.activeIndex);
  }, [props.activeIndex]);

  const filteredChildren = Children.toArray(props.children).filter((child) => child !== null);

  return (
    <>
      <SCTabs>
        {
          // eslint-disable-next-line
          Children.map<JSX.Element, any>(filteredChildren, (child: any, index: number) => {
            const testId = child.props?.testId ? `${child.props?.testId}-tab-btn` : `tab-btn-${index}`;
            return (
              <TabItem
                testId={testId}
                style={props.style}
                active={activeTabIndex === index}
                onSelect={() => selectTab(index)}
              >
                {child.props?.label}
              </TabItem>
            );
          })
        }
      </SCTabs>
      {
        // eslint-disable-next-line
        filteredChildren.filter((_child: any, index: number) => {
          return index === activeTabIndex;
        })
      }
    </>
  );
}

interface TabProps {
  label: ReactNode;
  testId?: string;
  style?: React.CSSProperties;
  isTightContent?: boolean;
}

function Tab(props: TabProps & { children: ReactNode }): JSX.Element {
  return (
    <TabContent
      data-testid={`${props.testId ? props.testId : props['data-testid']}`}
      isDenseContent={props?.isTightContent}
    >
      {props.children}
    </TabContent>
  );
}

export { Tabs, Tab };

// *******
// Private
// *******

interface TabItemProps {
  onSelect: () => void;
  active?: boolean;
  style?: React.CSSProperties;
  testId?: string;
}

function TabItem(props: TabItemProps & { children: ReactNode }) {
  function selectTab() {
    props.onSelect();
  }

  return (
    <SCTab
      data-testid={props?.testId}
      className={props.active && 'active'}
      style={props.style}
      onClick={() => selectTab()}
    >
      {props.children}
    </SCTab>
  );
}

// *****************
// Styled Components
// *****************

const SCTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ccc;
  overflow-x: auto;
`;

const SCTab = styled.div`
  padding: 0.5rem 1rem;
  cursor: pointer;
  min-width: 6rem;
  text-align: center;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  transition: background-color 500ms, border-bottom-width 100ms;
  padding-bottom: calc(0.5rem + 4px);
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;

  &:hover,
  &:active {
    background-color: #eee;
  }

  &.active {
    border-bottom: 4px solid var(--color-primary);
    padding-bottom: 0;
  }
`;

interface TabContentProps {
  isDenseContent?: boolean;
}

const TabContent = styled.div<TabContentProps>`
  padding: ${(props) => (props?.isDenseContent === true ? `0rem` : `1rem 0`)} > h1, > h2, > h3, > h4, > ul, > ol {
    margin-top: 0;
  }
`;
