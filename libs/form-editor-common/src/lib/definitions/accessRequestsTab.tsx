import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  GoabAccordion,
  GoabButton,
  GoabCallout,
  GoabCheckbox,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
} from '@abgov/react-components';
import {
  GoabCheckboxOnChangeDetail,
  GoabDropdownOnChangeDetail,
  GoabInputOnChangeDetail,
} from '@abgov/ui-components-common';
import DataTable from '@components/DataTable';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import type { KeycloakGroup } from '@store/access/models';
import type { RegistrationConfiguration } from '@store/form/model';
import { AccessRequestFieldModal } from './accessRequestFieldModal';
import {
  ACCESS_REQUEST_FIELD_TYPES,
  AccessRequestField,
  AccessRequestSettingsErrors,
  fromRegistrationSchemas,
  toRegistrationSchemas,
} from './accessRequestFields';
import { H3, ReviewDescription, ReviewEmptyState, ReviewTabBody } from './style-components';

interface AccessRequestsTabProps {
  registration?: RegistrationConfiguration;
  anonymousApply: boolean;
  // Null until loaded; onLoadGroups is called to load them the first time the tab is shown.
  groups: KeycloakGroup[] | null;
  groupsFailed: boolean;
  errors: AccessRequestSettingsErrors;
  onLoadGroups: () => void;
  onChange: (registration: RegistrationConfiguration | undefined) => void;
}

interface GroupFieldProps {
  name: string;
  label: string;
  helpText: string;
  value?: string;
  error?: string;
  groups: KeycloakGroup[] | null;
  groupsFailed: boolean;
  onChange: (value: string) => void;
}

const typeLabels = Object.fromEntries(ACCESS_REQUEST_FIELD_TYPES.map(({ value, label }) => [value, label]));

// Picks a Keycloak group; falls back to typing the group path when the groups can't be listed.
const GroupField: FunctionComponent<GroupFieldProps> = ({
  name,
  label,
  helpText,
  value,
  error,
  groups,
  groupsFailed,
  onChange,
}) => (
  <GoabFormItem label={label} helpText={helpText} error={error} mt="l">
    {groupsFailed || groups?.length === 0 ? (
      <GoabInput
        name={name}
        testId={name}
        size="compact"
        width="100%"
        placeholder="/group-name"
        value={value || ''}
        onChange={(detail: GoabInputOnChangeDetail) => onChange(detail.value)}
      />
    ) : (
      <GoabDropdown
        key={groups ? groups.length : 'loading'}
        name={name}
        testId={name}
        size="compact"
        width="100%"
        filterable
        disabled={!groups}
        placeholder={groups ? 'Select a group' : 'Loading groups...'}
        value={value || ''}
        onChange={(detail: GoabDropdownOnChangeDetail) => onChange(detail.value || '')}
      >
        {(groups || []).map((group) => (
          <GoabDropdownItem key={group.id} value={group.path} label={group.path} />
        ))}
      </GoabDropdown>
    )}
  </GoabFormItem>
);

export const AccessRequestsTab: FunctionComponent<AccessRequestsTabProps> = ({
  registration,
  anonymousApply,
  groups,
  groupsFailed,
  errors,
  onLoadGroups,
  onChange,
}) => {
  useEffect(() => {
    if (groups === null) {
      onLoadGroups();
    }
  }, [groups, onLoadGroups]);

  const fields = useMemo(() => fromRegistrationSchemas(registration), [registration]);
  // Index of the question being edited, -1 to add one, or null while the modal is closed.
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const enabled = !!registration?.enabled;

  const update = (settings: Partial<RegistrationConfiguration>) => onChange({ enabled, ...registration, ...settings });
  const updateFields = (next: AccessRequestField[]) => update(toRegistrationSchemas(next));

  const setEnabled = (checked: boolean) => {
    const { enabled: _enabled, ...settings } = registration || {};
    // Turning it off keeps the settings for later, unless there were none to keep.
    onChange(checked || Object.keys(settings).length > 0 ? { ...settings, enabled: checked } : undefined);
  };

  const editedField = editIndex !== null && editIndex >= 0 ? fields[editIndex] : undefined;
  const otherNames = fields.filter((_, index) => index !== editIndex).map(({ name }) => name);

  return (
    <ReviewTabBody data-testid="form-editor-access-requests-tab-body">
      <GoabAccordion
        heading="About access requests"
        headingSize="small"
        open={!enabled}
        mt="m"
        mb="l"
        testId="access-requests-description"
      >
        <ReviewDescription>
          <p>Restrict the form to approved users, for example to physicians and nurses in Alberta.</p>
          <p>
            Users without access fill in a short request in the Form App. Members of the approver group review it in the
            Form Admin app, and approved users are added to the user group, which must give the roles that can apply for
            this form.
          </p>
        </ReviewDescription>
      </GoabAccordion>

      {anonymousApply && (
        <GoabCallout
          type="information"
          size="medium"
          mb="m"
          heading="Not available for anonymous forms"
          testId="access-requests-anonymous"
        >
          Access requests aren&apos;t available for forms that allow anonymous applicants. Turn off anonymous applicants
          on the Lifecycle tab first.
        </GoabCallout>
      )}

      <GoabFormItem label="" error={errors.enabled}>
        <GoabCheckbox
          name="access-requests-enabled"
          testId="access-requests-enabled"
          text="Users must request access to this form"
          checked={enabled}
          disabled={anonymousApply && !enabled}
          onChange={(detail: GoabCheckboxOnChangeDetail) => setEnabled(detail.checked)}
        />
      </GoabFormItem>

      {enabled && (
        <>
          {groupsFailed && (
            <GoabCallout
              type="important"
              size="medium"
              mt="m"
              heading="Keycloak groups couldn't be loaded"
              testId="access-requests-groups-failed"
            >
              The groups can&apos;t be checked. Type the full group path, for example /medical-intake-users.
            </GoabCallout>
          )}
          <GroupField
            name="access-requests-access-group"
            label="User group"
            helpText="Approved users are added to this Keycloak group."
            value={registration.accessGroup}
            error={errors.accessGroup}
            groups={groups}
            groupsFailed={groupsFailed}
            onChange={(accessGroup) => update({ accessGroup })}
          />
          <GroupField
            name="access-requests-approver-group"
            label="Approver group"
            helpText="Members of this Keycloak group can approve or reject requests."
            value={registration.approverGroup}
            error={errors.approverGroup}
            groups={groups}
            groupsFailed={groupsFailed}
            onChange={(approverGroup) => update({ approverGroup })}
          />
          <GoabFormItem
            label="Notification email"
            helpText="Receives a message when someone requests access."
            error={errors.notificationEmail}
            mt="l"
          >
            <GoabInput
              name="access-requests-notification-email"
              testId="access-requests-notification-email"
              type="email"
              size="compact"
              width="100%"
              value={registration.notificationEmail || ''}
              onChange={(detail: GoabInputOnChangeDetail) => update({ notificationEmail: detail.value })}
            />
          </GoabFormItem>

          <H3>Questions</H3>
          <ReviewDescription>
            <p>The applicant&apos;s name and email address are always collected. Add only what reviewers need.</p>
          </ReviewDescription>
          {fields.length === 0 ? (
            <ReviewEmptyState data-testid="access-requests-no-questions">No questions added.</ReviewEmptyState>
          ) : (
            <DataTable data-testid="access-requests-questions">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Options</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.name} data-testid={`access-request-question-${field.name}`}>
                    <td>{field.name}</td>
                    <td>{field.label}</td>
                    <td>{typeLabels[field.type]}</td>
                    <td>{field.required ? 'Yes' : 'No'}</td>
                    <td>{field.options.join(', ')}</td>
                    <td>
                      <GoAContextMenuIcon
                        type="create"
                        title="Edit"
                        testId={`access-request-question-edit-${field.name}`}
                        onClick={() => setEditIndex(index)}
                      />
                      <GoAContextMenuIcon
                        type="trash"
                        title="Delete"
                        testId={`access-request-question-delete-${field.name}`}
                        onClick={() => updateFields(fields.filter((_, item) => item !== index))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
          <GoabButton
            type="secondary"
            size="compact"
            mt="m"
            testId="access-requests-add-question"
            onClick={() => setEditIndex(-1)}
          >
            Add question
          </GoabButton>
        </>
      )}

      <AccessRequestFieldModal
        open={editIndex !== null}
        field={editedField}
        otherNames={otherNames}
        onCancel={() => setEditIndex(null)}
        onSave={(field) => {
          updateFields(
            editIndex >= 0 ? fields.map((item, index) => (index === editIndex ? field : item)) : [...fields, field],
          );
          setEditIndex(null);
        }}
      />
    </ReviewTabBody>
  );
};
