import React, { FunctionComponent, useState } from 'react';
import {
  GoACheckbox,
  GoATextArea,
  GoAButton,
  GoAButtonGroup,
  GoAInput,
  GoAFormItem,
  GoAModal,
} from '@abgov/react-components-new';
import { ScriptItem } from '@store/script/models';
import { useSelector } from 'react-redux';
import { Role } from '@store/tenant/models';
import { ConfigServiceRole } from '@store/access/models';
import { useValidators } from '@lib/validation/useValidators';
import { toKebabName } from '@lib/kebabName';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { IdField } from './styled-components';
import { ServiceRoleConfig } from '@store/access/models';
import { RootState } from '@store/index';
import { UseServiceAccountWrapper } from './styled-components';
import { ClientRoleTable } from '@components/RoleTable';

interface AddScriptModalProps {
  initialValue?: ScriptItem;
  onCancel?: () => void;
  onSave: (script: ScriptItem) => void;
  open: boolean;
  realmRoles: Role[];
  tenantClients: ServiceRoleConfig;
}

export const AddScriptModal: FunctionComponent<AddScriptModalProps> = ({
  initialValue,
  onCancel,
  onSave,
  open,
  realmRoles,
  tenantClients,
}: AddScriptModalProps): JSX.Element => {
  const [script, setScript] = useState<ScriptItem>(initialValue);

  const scripts = useSelector((state: RootState) => {
    return state?.scriptService?.scripts;
  });
  const scriptNames = scripts ? Object.keys(scripts) : [];
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .add('duplicated', 'name', duplicateNameCheck(scriptNames, 'Script'))
    .build();

  const roleNames = realmRoles.map((role) => {
    return role.name;
  });

  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    tenantClients &&
    Object.entries(tenantClients).length > 0 &&
    Object.entries(tenantClients)
      .filter(([clientId, config]) => {
        return (config as ConfigServiceRole).roles.length > 0;
      })
      .map(([clientId, config]) => {
        const roles = (config as ConfigServiceRole).roles;
        const roleNames = roles.map((role) => {
          return role.role;
        });
        return { roleNames: roleNames, clientId: clientId, currentElements: null };
      });
  elements = elements.concat(clientElements);

  const validationCheck = () => {
    const validations = {
      name: script.id,
    };

    validations['duplicated'] = script.id;

    if (!validators.checkAll(validations)) {
      return;
    }

    onSave(script);
    onCancel();
    validators.clear();
  };
  const RunnerRole = ({ roleNames, clientId }) => {
    return (
      <>
        <ClientRoleTable
          roles={roleNames}
          clientId={clientId}
          roleSelectFunc={(roles) => {
            setScript({
              ...script,
              runnerRoles: roles,
            });
          }}
          nameColumnWidth={80}
          service="Script"
          checkedRoles={[{ title: 'runner', selectedRoles: script?.runnerRoles }]}
        />
      </>
    );
  };

  return (
    <GoAModal
      testId="add-script-modal"
      open={open}
      heading="Add script"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="script-modal-cancel"
            onClick={() => {
              validators.clear();
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="script-modal-save"
            disabled={validators && validators.haveErrors()}
            onClick={() => {
              validationCheck();
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors?.['name']} label="Name">
        <GoAInput
          type="text"
          name="name"
          value={script.name}
          width="100%"
          testId={`script-modal-name-input`}
          aria-label="name"
          onChange={(name, value) => {
            const scriptId = toKebabName(value);
            validators.remove('name');
            const validations = {
              name: value,
            };
            validations['duplicated'] = scriptId;
            validators.checkAll(validations);
            setScript({ ...script, name: value, id: scriptId });
          }}
        />
      </GoAFormItem>
      <GoAFormItem label="Script ID">
        <IdField>{script.id}</IdField>
      </GoAFormItem>

      <GoAFormItem error={errors?.['description']} label="Description">
        <GoATextArea
          name="description"
          value={script.description}
          testId={`script-modal-description-input`}
          aria-label="description"
          width="100%"
          onChange={(name, value) => {
            const description = value;
            validators.remove('description');
            validators['description'].check(description);
            setScript({ ...script, description });
          }}
        />
      </GoAFormItem>
      <UseServiceAccountWrapper>
        <GoACheckbox
          checked={script.useServiceAccount}
          name="script-use-service-account-checkbox"
          testId="script-use-service-account-checkbox"
          onChange={() => {
            setScript({
              ...script,
              useServiceAccount: !script.useServiceAccount,
            });
          }}
          ariaLabel={`script-use-service-account-checkbox`}
        />
        Use service account
      </UseServiceAccountWrapper>

      {tenantClients &&
        elements.map((e, key) => {
          return <RunnerRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
        })}
      {Object.entries(tenantClients).length === 0 && (
        <GoASkeletonGridColumnContent key={1} rows={4}></GoASkeletonGridColumnContent>
      )}
    </GoAModal>
  );
};
