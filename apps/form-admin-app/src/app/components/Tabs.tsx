import { GoabIcon, type GoabIconProps } from '@abgov/react-components';
import { FunctionComponent, ReactNode, useState } from 'react';
import styled from 'styled-components';

interface TabProps {
  heading: string;
  hide?: boolean;
  children: ReactNode;
  icon?: GoabIconProps['type'];
}
export const Tab: FunctionComponent<TabProps> = ({ children }) => {
  return children;
};

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  & > .heading {
    flex: 0;
    border-bottom: 1px solid var(--goa-color-greyscale-100);
    > button {
      border: none;
      padding: var(--goa-space-s);
      margin-right: var(--goa-space-xs);
      cursor: pointer;
      font: var(--goa-typography-body-m);
    }
    > button:hover,
    button[data-selected='true'] {
      border-bottom: 3px solid var(--goa-color-interactive-default);
      font: var(--goa-typography-heading-s);
    }
  }
  & > .content {
    flex: 1;
    min-height: 0;
    position: relative;
    > * {
      position: absolute;
      height: 100%;
      width: 100%;
    }
  }
  > .content[data-selected='false'] {
    display: none;
  }
`;

interface TabsProps {
  children: React.ReactElement<TabProps>[];
}
export const Tabs: FunctionComponent<TabsProps> = ({ children }) => {
  const [selected, setSelected] = useState(0);

  const available = children.filter((child) => !child.props.hide);

  return (
    <TabContainer>
      <div className="heading">
        {available.length > 1 &&
          available.map((child, idx) => (
            <button key={child.props.heading} data-selected={idx === selected} onClick={() => setSelected(idx)}>
              <span>{child.props.heading}</span>
              {child.props.icon && (
                <GoabIcon type={child.props.icon} size="small" ml="xs" ariaLabel={child.props.icon} />
              )}
            </button>
          ))}
      </div>
      {available.map((child, idx) => (
        <div className="content" data-selected={idx === selected}>
          {child}
        </div>
      ))}
    </TabContainer>
  );
};
