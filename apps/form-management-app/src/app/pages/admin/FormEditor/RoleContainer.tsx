import React, { useEffect, useState } from 'react';
import styles from './Editor.module.scss';
import { JsonSchema } from '@jsonforms/core';


import { GoAButtonGroup, GoACheckbox } from '@abgov/react-components';
import { FormDefinition } from '../../../state';

import { ClientRoleTable } from '../../../components/RoleTable';

export interface UiEditorContainerProps {
  errors: Record<string, string | null>;
  editorErrors: {
    uiSchema: string | null;
    dataSchemaJSON: string | null;
    dataSchemaJSONSchema: string | null;
  };
  tempUiSchema: JsonSchema;
  setDraftUiSchema: (schema: string) => void;
  setEditorErrors: React.Dispatch<
    React.SetStateAction<{
      uiSchema: string | null;
      dataSchemaJSON: string | null;
      dataSchemaJSONSchema: string | null;
    }>
  >;
}

interface ClientRoleProps {
  roleNames: string[];
  clientId: string;
  anonymousRead: boolean;
  onUpdateRoles: (roles: string[], type: string) => void;
  configuration: Record<string, string[]>;
}

const types = [
  { type: 'applicantRoles', name: 'Applicant roles' },
  { type: 'clerkRoles', name: 'Clerk roles' },
  { type: 'assessorRoles', name: 'Assessor roles' },
];
const applicantRoles = types[0];
const clerkRoles = types[1];

interface RoleContainerProps {
  definition: FormDefinition;
  // eslint-disable-next-line
  roles: string[];
  updateEditorFormDefinition: (update: Partial<FormDefinition>) => void;
  fetchKeycloakServiceRoles: () => void;
}

const ClientRole = ({ roleNames, clientId, anonymousRead, configuration, onUpdateRoles }: ClientRoleProps) => {
  return (
    <ClientRoleTable
      roles={roleNames}
      clientId={clientId}
      anonymousRead={anonymousRead}
      roleSelectFunc={onUpdateRoles}
      nameColumnWidth={40}
      service="FormService"
      checkedRoles={[
        { title: types[0].name, selectedRoles: configuration[types[0].type], disabled: anonymousRead },
        { title: types[1].name, selectedRoles: configuration[types[1].type] },
        { title: types[2].name, selectedRoles: configuration[types[2].type] },
      ]}
    />
  );
};

export const RoleContainer: React.FC<RoleContainerProps> = ({
  definition,
  roles,
  updateEditorFormDefinition,
  fetchKeycloakServiceRoles,
}): JSX.Element => {
  const [showSelectedRoles, setShowSelectedRoles] = useState(false);

  const setDefinition = (update: Partial<FormDefinition>) => updateEditorFormDefinition(update);

  const getFilteredRoles = (
    roleNames: string[],
    clientId: string,
    checkedRoles: Record<string, string[] | undefined>
  ) => {
    const allCheckedRoles = Object.values(checkedRoles).flat();
    return showSelectedRoles
      ? roleNames.filter((role) => {
          const selectedRole = clientId ? `${clientId}:${role}` : role;
          return allCheckedRoles.includes(selectedRole);
        })
      : roleNames;
  };

  useEffect(() => {
    console.log('TRIGGERING FETCHKEYCLOAK');
    if (definition) {
      fetchKeycloakServiceRoles();
    }
  }, [definition]);

  return (
    <div className={styles.BorderBottom}>
      <div className={styles.addToggleButtonPadding}>
        <GoAButtonGroup alignment="start">
          <GoACheckbox
            name="showSelectedRoles"
            text="Show selected roles"
            checked={showSelectedRoles}
            onChange={() => setShowSelectedRoles((prev) => !prev)}
          />
        </GoAButtonGroup>
      </div>
      <div className={styles.rolesTabBody} data-testid="roles-editor-body">
        <div className={styles.scrollPane}>
          {roles.map((e, key) => {
            const rolesMap = getFilteredRoles(e.roleNames, e.clientId, {
              applicantRoles: definition?.applicantRoles,
              clerkRoles: definition?.clerkRoles,
              assessorRoles: definition?.assessorRoles,
            });
            return (
              rolesMap.length > 0 && (
                <ClientRole
                  roleNames={rolesMap}
                  key={key}
                  clientId={e.clientId}
                  anonymousRead={definition.anonymousApply}
                  configuration={{
                    applicantRoles: definition.applicantRoles,
                    clerkRoles: definition.clerkRoles,
                    assessorRoles: definition.assessorRoles,
                  }}
                  // eslint-disable-next-line
                  onUpdateRoles={(roles: any, type: any) => {
                    if (type === applicantRoles.name) {
                      setDefinition({
                        applicantRoles: [...new Set(roles as string[])],
                      });
                    } else if (type === clerkRoles.name) {
                      setDefinition({
                        clerkRoles: [...new Set(roles as string[])],
                      });
                    } else {
                      setDefinition({
                        assessorRoles: [...new Set(roles as string[])],
                      });
                    }
                  }}
                />
              )
            );
          })}
        </div>
      </div>
    </div>
  );
};;
