import { GoAButton, GoAButtonGroup, GoAModal, GoAInput, GoAFormItem } from '@abgov/react-components';
import { TextGoASkeleton } from '@core-services/app-common';
import { useState, useEffect, FunctionComponent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { styled } from 'styled-components';
import { ClientRoleTable } from '@components/RoleTable';
import { useValidators } from '@lib/validation/useValidators';
import { toKebabName } from '@lib/kebabName';
import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { FetchRealmRoles } from '@store/tenant/actions';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { selectRoleList } from '@store/sharedSelectors/roles';
import { AgentConfiguration } from '@store/agent/model';
import { agentNamesSelector } from '@store/agent/selectors';
import defaultInstructions from './defaultInstructions';

const IdField = styled.div`
  min-height: 1.6rem;
`;

interface AddAgentModalProps {
  onCancel: () => void;
  onSave: (agent: AgentConfiguration) => void;
  open: boolean;
}

export const AddAgentModal: FunctionComponent<AddAgentModalProps> = ({ onCancel, onSave, open }) => {
  const initialValue = { name: '', instructions: defaultInstructions, userRoles: [] };
  const [agent, setAgent] = useState<Partial<AgentConfiguration>>(initialValue);
  const dispatch = useDispatch();
  const roles = useSelector(selectRoleList);
  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
  }, [dispatch]);

  const agentNames = useSelector(agentNamesSelector);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateNameCheck(agentNames, 'Agent'))
    .build();

  const validateField = (field: string, value: string) => {
    validators.remove(field);
    const validations = { [field]: value };
    if (field === 'name') {
      validations['duplicated'] = value;
    }
    validators.checkAll(validations);
  };

  return (
    <GoAModal
      testId="add-agent-modal"
      open={open}
      heading="Add agent"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="agent-modal-cancel"
            onClick={() => {
              onCancel();
              setAgent(initialValue);
            }}
          >
            Cancel
          </GoAButton>

          <GoAButton
            type="primary"
            testId="agent-modal-save"
            disabled={validators.haveErrors()}
            onClick={() => {
              const validations: Record<string, unknown> = {
                name: agent.name,
              };
              validations['duplicated'] = agent.name;

              if (!validators.checkAll(validations)) {
                return;
              }

              onSave(agent);
              if (onCancel) {
                onCancel();
                setAgent(initialValue);
              }
              validators.clear();
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors?.['name']} label="Name" mb="l">
        <GoAInput
          type="text"
          name="name"
          value={agent.name}
          testId={`agent-modal-name-input`}
          aria-label="name"
          width="100%"
          onChange={(_, value) => {
            validateField('name', value);
            const agentId = toKebabName(value);
            setAgent({ ...agent, id: agentId, name: value });
          }}
          onBlur={() => validateField('name', agent?.name || '')}
        />
      </GoAFormItem>

      <GoAFormItem label="Agent ID">
        <IdField>{agent.id}</IdField>
      </GoAFormItem>

      {roles?.map(({ clientId, roleNames }) => (
        <ClientRoleTable
          key={clientId}
          roles={roleNames}
          clientId={clientId}
          roleSelectFunc={(roles: string[]) => {
            setAgent({
              ...agent,
              userRoles: roles,
            });
          }}
          nameColumnWidth={80}
          service="Agent"
          checkedRoles={[{ title: 'use', selectedRoles: agent?.userRoles }]}
        />
      ))}
      {roles?.length === 0 && <TextGoASkeleton />}
    </GoAModal>
  );
};
