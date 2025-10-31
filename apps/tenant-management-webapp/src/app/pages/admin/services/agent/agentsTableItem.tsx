import { Fragment, FunctionComponent, useState } from 'react';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { AgentConfiguration } from '@store/agent/model';
import styled from 'styled-components';
import { IconDiv } from '../task/styled-components';

const DetailsPre = styled.pre`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-space-m);
  padding: var(--goa-space-m);
  text-align: left;
  margin: 0;
`;

interface AgentTableItemProps {
  agent: AgentConfiguration;
  onEditAgent?: (agent: AgentConfiguration) => void;
  onDeleteAgent?: (agent: AgentConfiguration) => void;
}

export const AgentTableItem: FunctionComponent<AgentTableItemProps> = ({ agent, onEditAgent, onDeleteAgent }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Fragment>
      <tr>
        <td data-testid="agent-name">{agent.name}</td>
        <td data-testid="agent-action">
          <IconDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={() => {
                  setShowDetails(!showDetails);
                }}
                testId="agent-toggle-details-visibility"
              />
            </GoAContextMenu>
            {onEditAgent && (
              <GoAContextMenu>
                <GoAContextMenuIcon
                  type="create"
                  title="Edit"
                  onClick={() => onEditAgent(agent)}
                  testId={`edit-agent-item-${agent.id}`}
                />
              </GoAContextMenu>
            )}
            {onDeleteAgent && (
              <GoAContextMenu>
                <GoAContextMenuIcon
                  data-testid="delete-icon"
                  type="trash"
                  onClick={() => onDeleteAgent(agent)}
                  testId={`delete-agent-item-${agent.id}`}
                />
              </GoAContextMenu>
            )}
          </IconDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={7}
            style={{
              padding: '0px',
            }}
          >
            <DetailsPre>{JSON.stringify(agent, null, 2)}</DetailsPre>
          </td>
        </tr>
      )}
    </Fragment>
  );
};
