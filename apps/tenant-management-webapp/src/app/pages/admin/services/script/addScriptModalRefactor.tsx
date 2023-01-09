import React, { FunctionComponent, useState } from 'react';

import { GoACheckbox } from '@abgov/react-components-new';
import { CommonModal, Config } from '@components/modal/CommonModal';
import { ScriptItem } from '@store/script/models';
import { useSelector } from 'react-redux';
import { Role } from '@store/tenant/models';
import { ConfigServiceRole } from '@store/access/models';
import { useValidators } from '@lib/useValidators';
import { toKebabName } from '@lib/kebabName';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import { characterCheck, validationPattern, isNotEmptyCheck, Validator, wordMaxLengthCheck } from '@lib/checkInput';

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
  const wordLengthCheck = wordMaxLengthCheck(32);

  const duplicateScriptCheck = (): Validator => {
    return (name: string) => {
      return scripts[name]
        ? `Duplicated script name ${name}, Please use a different name to get a unique script name`
        : '';
    };
  };

  const { errors, validators } = useValidators(
    'name',
    'name',
    checkForBadChars,
    wordLengthCheck,
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateScriptCheck())
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

  const nameOnChange = (name, value) => {
    const scriptId = toKebabName(value);
    validators.remove('name');
    const validations = {
      name: value,
    };
    validations['duplicated'] = scriptId;
    validators.checkAll(validations);
    setScript({ ...script, name: value, id: scriptId });
  };
  const descOnchange = (name, value) => {
    const description = value;
    setScript({ ...script, description });
  };

  const scriptModalConfig: Config = {
    open: open,
    heading: 'Add Script',
    dateTestId: 'add-script-modal',
    onCancel: onCancel,
    onSubmit: validationCheck,
    saveButtonDisable: validators && validators.haveErrors(),
    body: [
      {
        type: 'GoAFormItem',
        label: 'Name',
        error: errors?.['name'],
        subType: 'GoAInput',
        inputType: 'text',
        name: 'name',
        value: script.name,
        onChange: (name, value) => nameOnChange(name, value),
      },
      {
        type: 'GoAFormItem',
        label: 'Script ID',
        subType: 'div',
        value: script.id,
      },
      {
        type: 'GoAFormItem',
        label: 'Description',
        error: errors?.['description'],
        subType: 'GoATextArea',
        name: 'description',
        value: script.description,
        onChange: (name, value) => descOnchange(name, value),
      },
    ],
  };

  return (
    <>
      <CommonModal modalConfig={scriptModalConfig}>
        {' '}
        <>
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
        </>
      </CommonModal>
    </>
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
                    data-testid={`script-runner-role-checkbox-${role}`}
                    ariaLabel={`script-use-service-account-checkbox`}
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
