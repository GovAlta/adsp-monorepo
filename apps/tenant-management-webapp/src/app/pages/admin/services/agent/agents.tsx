import { GoAButton } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Padding } from '@components/styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { renderNoItem } from '@components/NoItem';
import { AppDispatch, RootState } from '@store/index';
import { agentsSelector } from '@store/agent/selectors';
import { deleteAgent, getAgents, updateAgent } from '@store/agent/actions';
import { AgentsTable } from './agentsTable';
import { AddAgentModal } from './addAgentModal';
import { AgentConfiguration } from '@store/agent/model';
import { useNavigate } from 'react-router-dom';

interface AgentsProps {
  openAddAgent: boolean;
  setOpenAddAgent: (val: boolean) => void;
}
export const Agents: FunctionComponent<AgentsProps> = ({ openAddAgent, setOpenAddAgent }) => {
  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(getAgents());
    navigate('../agents', { replace: true });
  }, [dispatch]);

  const tenantAgents = useSelector((state: RootState) => agentsSelector(state, false));
  const coreAgents = useSelector((state: RootState) => agentsSelector(state, true));

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<AgentConfiguration>(null);

  return (
    <div>
      <Padding>Agents are configurations of LLMs for specific purposes.</Padding>
      <GoAButton
        testId="add-agent"
        onClick={() => {
          setOpenAddAgent(true);
        }}
        mb="l"
      >
        Add agent
      </GoAButton>
      {tenantAgents.length === 0 ? (
        renderNoItem('tenant agents')
      ) : (
        <AgentsTable
          agents={tenantAgents}
          onDeleteAgent={(agent) => setShowDeleteConfirmation(agent)}
          onEditAgent={(agent) => navigate(`../edit/${agent.id}`)}
        />
      )}

      {coreAgents.length === 0 ? (
        renderNoItem('core agents')
      ) : (
        <>
          <h2>Core agents</h2>
          <AgentsTable agents={coreAgents} />
        </>
      )}
      <AddAgentModal
        open={openAddAgent}
        onCancel={() => {
          setOpenAddAgent(false);
        }}
        onSave={(agent) => {
          dispatch(updateAgent(agent));
        }}
      />
      <DeleteModal
        isOpen={showDeleteConfirmation !== null}
        title="Delete agent"
        content={
          <div>
            Are you sure you wish to delete <b>{showDeleteConfirmation?.name}</b>?
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(null)}
        onDelete={() => {
          dispatch(deleteAgent(showDeleteConfirmation.id));
          setShowDeleteConfirmation(null);
        }}
      />
    </div>
  );
};
