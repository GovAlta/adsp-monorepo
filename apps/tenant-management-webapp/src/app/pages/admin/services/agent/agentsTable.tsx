import { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';
import { AgentConfiguration } from '@store/agent/model';
import { AgentTableItem } from './agentsTableItem';

export interface AgentsTableProps {
  agents: AgentConfiguration[];
  onEditAgent?: (agent: AgentConfiguration) => void;
  onDeleteAgent?: (agent: AgentConfiguration) => void;
}

export const AgentsTable: FunctionComponent<AgentsTableProps> = ({ agents, onEditAgent, onDeleteAgent }) => {
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  return (
    <DataTable data-testid="agents-table">
      <thead data-testid="agents-table-header">
        <tr>
          <th data-testid="agents-table-header-name">Agent</th>
          <th id="agents-action" data-testid="agents-table-header-action">
            Actions
          </th>
        </tr>
      </thead>
      {indicator && <PageIndicator />}
      <tbody>
        {agents?.map((agent, index) => {
          return <AgentTableItem key={index} agent={agent} onEditAgent={onEditAgent} onDeleteAgent={onDeleteAgent} />;
        })}
      </tbody>
    </DataTable>
  );
};
