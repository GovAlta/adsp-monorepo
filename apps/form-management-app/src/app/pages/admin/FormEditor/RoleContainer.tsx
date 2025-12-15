import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styles from './Editor.module.scss';
import { JsonSchema } from '@jsonforms/core';

import { GoAButtonGroup, GoACheckbox } from '@abgov/react-components';
import { FormDefinition } from '../../../state';

import { ClientRoleTable } from '../../../components/RoleTable';
import { ClientElement } from '../../../state/keycloak/selectors';

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
const assessorRoles = types[2];

interface RoleContainerProps {
  definition: FormDefinition;
  roles: ClientElement[];
  updateEditorFormDefinition: (update: Partial<FormDefinition>) => void;
  fetchKeycloakServiceRoles: () => void;
}

const ClientRole = React.memo(
  ({ roleNames, clientId, anonymousRead, configuration, onUpdateRoles }: ClientRoleProps) => {
    // Memoize checkedRoles so it doesn't recreate each render
    const checkedRoles = useMemo(
      () => [
        {
          title: applicantRoles.name,
          selectedRoles: configuration[applicantRoles.type] || [],
          disabled: anonymousRead,
        },
        { title: clerkRoles.name, selectedRoles: configuration[clerkRoles.type] || [] },
        { title: assessorRoles.name, selectedRoles: configuration[assessorRoles.type] || [] },
      ],
      [configuration, anonymousRead]
    );

    return (
      <ClientRoleTable
        roles={roleNames}
        clientId={clientId}
        anonymousRead={anonymousRead}
        roleSelectFunc={onUpdateRoles}
        nameColumnWidth={40}
        service="FormService"
        checkedRoles={checkedRoles}
      />
    );
  }
);

export const RoleContainer: React.FC<RoleContainerProps> = ({
  definition,
  roles,
  updateEditorFormDefinition,
  fetchKeycloakServiceRoles,
}): JSX.Element => {
  const [showSelectedRoles, setShowSelectedRoles] = useState(false);

  const setDefinition = useCallback(
    (update: Partial<FormDefinition>) => {
      updateEditorFormDefinition(update);
    },
    [updateEditorFormDefinition]
  );

  // Memoize filtered roles per client
  const getFilteredRoles = useCallback(
    (roleNames: string[], clientId: string) => {
      if (!definition) return [];
      if (!showSelectedRoles) return roleNames;

      const allCheckedRoles = [
        ...(definition.applicantRoles || []),
        ...(definition.clerkRoles || []),
        ...(definition.assessorRoles || []),
      ];

      return roleNames.filter((role) => {
        const selectedRole = clientId ? `${clientId}:${role}` : role;
        return allCheckedRoles.includes(selectedRole);
      });
    },
    [definition, showSelectedRoles]
  );

  // Stable handler for updating roles
  const handleUpdateRoles = useCallback(
    (roles: string[], type: string) => {
      if (!definition) return;

      if (type === applicantRoles.name) {
        setDefinition({ applicantRoles: Array.from(new Set(roles)) });
      } else if (type === clerkRoles.name) {
        setDefinition({ clerkRoles: Array.from(new Set(roles)) });
      } else if (type === assessorRoles.name) {
        setDefinition({ assessorRoles: Array.from(new Set(roles)) });
      }
    },
    [definition, setDefinition]
  );


  useEffect(() => {
    if (definition && roles.length <= 1) {
      fetchKeycloakServiceRoles();
    }
  }, []);

  // Memoize configuration object per render
  const configuration = useMemo(
    () => ({
      applicantRoles: definition?.applicantRoles || [],
      clerkRoles: definition?.clerkRoles || [],
      assessorRoles: definition?.assessorRoles || [],
    }),
    [definition]
  );

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
            const rolesMap = getFilteredRoles(e.roleNames, e.clientId);
            if (rolesMap.length === 0) return null;

            return (
              <ClientRole
                roleNames={rolesMap}
                key={e.clientId || key}
                clientId={e.clientId}
                anonymousRead={definition?.anonymousApply || false}
                configuration={configuration}
                onUpdateRoles={handleUpdateRoles}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
