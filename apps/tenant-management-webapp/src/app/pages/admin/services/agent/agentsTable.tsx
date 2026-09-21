import { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';
import { AgentConfiguration } from '@store/agent/model';
import { AgentTableItem } from './agentsTableItem';
import { agentBusySelector } from '../../../../store/agent/selectors';

export interface AgentsTableProps {
  agents: AgentConfiguration[];
  isCore: boolean;
  onEditAgent?: (agent: AgentConfiguration) => void;
  onDeleteAgent?: (agent: AgentConfiguration) => void;
}

export const AgentsTable: FunctionComponent<AgentsTableProps> = ({isCore, agents, onEditAgent, onDeleteAgent }) => {
  const busy = useSelector(agentBusySelector);

  return busy ? (
    <PageIndicator />
  ) : (
    <>
      {isCore ? <h2>Core agents</h2> : null}
      <DataTable data-testid="agents-table">
        <thead data-testid="agents-table-header">
          <tr>
            <th data-testid="agents-table-header-name">Agent</th>
            <th id="agents-action" data-testid="agents-table-header-action" style={{ textAlign: 'right' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {agents?.map((agent, index) => {
            return <AgentTableItem key={index} agent={agent} onEditAgent={onEditAgent} onDeleteAgent={onDeleteAgent} />;
          })}
        </tbody>
      </DataTable>
    </>
  );
};
