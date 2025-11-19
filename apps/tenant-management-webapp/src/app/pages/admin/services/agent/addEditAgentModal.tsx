import { GoAButton, GoAButtonGroup, GoAModal, GoAInput, GoAFormItem, GoATextArea } from '@abgov/react-components';
import { TextGoASkeleton } from '@core-services/app-common';
import { useState, useEffect, FunctionComponent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { styled } from 'styled-components';
import { HelpTextComponent } from '@components/HelpTextComponent';
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

interface AddEditAgentModalProps {
  agent?: AgentConfiguration;
  onCancel: () => void;
  onSave: (agent: AgentConfiguration) => void;
  open: boolean;
}

export const AddEditAgentModal: FunctionComponent<AddEditAgentModalProps> = ({
  agent: initialValue,
  onCancel,
  onSave,
  open,
}) => {
  const defaultValue = { name: '', instructions: defaultInstructions, userRoles: [] };
  const [agent, setAgent] = useState<Partial<AgentConfiguration>>(defaultValue);
  const dispatch = useDispatch();
  const roles = useSelector(selectRoleList);

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
  }, [dispatch]);

  useEffect(() => {
    setAgent(initialValue || defaultValue);
  }, [initialValue]);

  const agentNames = useSelector(agentNamesSelector);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'), isNotEmptyCheck('description'))
    .add(
      'duplicated',
      'name',
      duplicateNameCheck(
        agentNames.filter((name) => !initialValue || name !== initialValue?.name),
        'Agent'
      )
    )
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
              setAgent(initialValue || defaultValue);
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
              validators.clear();
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <form>
        <GoAFormItem error={errors?.['name']} label="Name" mb="l">
          <GoAInput
            disabled={initialValue}
            type="text"
            name="name"
            value={agent.name}
            testId="agent-modal-name-input"
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
        <GoAFormItem label="Agent ID" mb="l">
          <IdField>{agent.id}</IdField>
        </GoAFormItem>
        <GoAFormItem error={errors?.['description']} label="Description" mb="m">
          <GoATextArea
            name="description"
            value={agent.description || ''}
            testId="api-tool-modal-description-input"
            aria-label="description"
            width="100%"
            onChange={(_, value) => {
              validators.remove('description');
              validators['description'].check(value);
              setAgent({ ...agent, description: value });
            }}
          />
          <HelpTextComponent
            length={agent.description?.length || 0}
            maxLength={250}
            descErrMessage="Agent description can not be over 250 characters"
            errorMsg={errors?.['description']}
          />
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
            checkedRoles={[{ title: 'Use agent', selectedRoles: agent?.userRoles }]}
          />
        ))}
        {roles?.length === 0 && <TextGoASkeleton />}
      </form>
    </GoAModal>
  );
};
