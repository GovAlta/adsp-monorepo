import React, { FunctionComponent, useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton, GoACheckbox } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { ScriptItem } from '@store/script/models';
import { useSelector } from 'react-redux';
import { Role } from '@store/tenant/models';
import { ConfigServiceRole } from '@store/access/models';
import { useValidators } from '@lib/useValidators';
import { toKebabName } from '@lib/kebabName';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import { characterCheck, validationPattern, isNotEmptyCheck, Validator } from '@lib/checkInput';
import { IdField } from './styled-components';
import { ServiceRoleConfig } from '@store/access/models';
import { RootState } from '@store/index';
import { UseServiceAccountWrapper, DataTableWrapper } from './styled-components';
import DataTable from '@components/DataTable';

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

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const duplicateScriptCheck = (): Validator => {
    return (name: string) => {
      return scripts[script.name]
        ? `Duplicated script name ${name}, Please use a different name to get a unique script name`
        : '';
    };
  };
  const descriptionCheck = (): Validator => (description: string) =>
    description.length > 250 ? 'Description should not exceed 250 characters' : '';

  const { errors, validators } = useValidators('name', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .add('duplicated', 'name', duplicateScriptCheck())
    .add('description', 'description', descriptionCheck())
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
      name: script.name,
    };

    validations['duplicated'] = script.name;

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
        <RunnerRoleTable
          roles={roleNames}
          clientId={clientId}
          roleSelectFunc={(roles, type) => {
            setScript({
              ...script,
              runnerRoles: roles,
            });
          }}
          runnerRoles={script?.runnerRoles}
        />
      </>
    );
  };

  return (
    <GoAModal testId="add-script-modal" isOpen={open}>
      <GoAModalTitle>Add script</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['name']}>
            <label>Name</label>
            <GoAInput
              type="text"
              name="name"
              value={script.name}
              data-testid={`script-modal-name-input`}
              aria-label="name"
              onChange={(name, value) => {
                const validations = {
                  name: value,
                };
                validators.remove('name');

                validations['duplicated'] = value;

                validators.checkAll(validations);
                const scriptId = toKebabName(value);
                setScript({ ...script, name: value, id: scriptId });
              }}
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Script ID</label>
            <IdField>{script.id}</IdField>
          </GoAFormItem>

          <GoAFormItem error={errors?.['description']}>
            <label>Description</label>
            <GoAInput
              type="text"
              name="description"
              value={script.description}
              data-testid={`script-modal-description-input`}
              aria-label="description"
              onChange={(name, value) => {
                validators.remove('description');
                validators['description'].check(value);
                setScript({ ...script, description: value });
              }}
            />
          </GoAFormItem>
          <UseServiceAccountWrapper>
            <GoACheckbox
              checked={script.useServiceAccount}
              name="script-use-service-account-checkbox"
              data-testid="script-use-service-account-checkbox"
              onChange={() => {
                setScript({
                  ...script,
                  useServiceAccount: !script.useServiceAccount,
                });
              }}
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
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          buttonType="secondary"
          data-testid="script-modal-cancel"
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          buttonType="primary"
          data-testid="script-modal-save"
          onClick={(e) => {
            validationCheck();
          }}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};

interface RunnerRoleTableProps {
  roles: string[];
  roleSelectFunc: (roles: string[], type: string) => void;
  runnerRoles: string[];

  clientId: string;
}

const RunnerRoleTable = (props: RunnerRoleTableProps): JSX.Element => {
  const [runnerRoles, setRunnerRoles] = useState(props.runnerRoles);

  return (
    <DataTableWrapper>
      <DataTable noScroll={true}>
        <thead>
          <tr>
            <th id="script-runner-roles" className="role-name">
              {props.clientId ? props.clientId + ' roles' : 'Roles'}
            </th>
            <th id="script-runner-role-action" className="role">
              Runner
            </th>
          </tr>
        </thead>

        <tbody>
          {props.roles?.map((role): JSX.Element => {
            const compositeRole = props.clientId ? `${props.clientId}:${role}` : role;
            return (
              <tr key={`add-script-role-row-${role}`}>
                <td className="role-name">{role}</td>
                <td className="role-checkbox">
                  <GoACheckbox
                    name={`script-runner-role-checkbox-${role}`}
                    key={`script-runner-role-checkbox-${compositeRole}`}
                    checked={runnerRoles.includes(compositeRole)}
                    data-testid={`file-type-read-role-checkbox-${role}`}
                    onChange={() => {
                      if (runnerRoles.includes(compositeRole)) {
                        const newRoles = runnerRoles.filter((runnerRole) => {
                          return runnerRole !== compositeRole;
                        });
                        setRunnerRoles(newRoles);
                        props.roleSelectFunc(newRoles, 'read');
                      } else {
                        const newRoles = [...runnerRoles, compositeRole];
                        setRunnerRoles(newRoles);
                        props.roleSelectFunc(newRoles, 'read');
                      }
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </DataTableWrapper>
  );
};
