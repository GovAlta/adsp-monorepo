import React, { useState } from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabCheckbox,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabIconButton,
  GoabInput,
  GoabModal,
} from '@abgov/react-components';
import {
  GoabCheckboxOnChangeDetail,
  GoabDropdownOnChangeDetail,
  GoabInputOnChangeDetail,
} from '@abgov/ui-components-common';
import { useSelector } from 'react-redux';
import { toKebabName } from '@lib/kebabName';
import { RootState } from '@store/index';
import { SharepointDestination, SharepointFieldMapping } from '@store/sharePoint/actions';
import { defaultDestination } from '@store/sharePoint/model';
import { ConnectionPadding, MappingGrid, MappingHeading } from '../styled-components';
import { formatIdempotencyFields, parseIdempotencyFields, validateDestination } from './destinationHelpers';

interface DestinationModalProps {
  destinationId: string | undefined;
  onCancel: () => void;
  onSave: (destination: SharepointDestination) => void;
}

export const DestinationModal = ({ destinationId, onCancel, onSave }: DestinationModalProps): JSX.Element => {
  const isNew = !destinationId;
  const { connections, destinations } = useSelector((state: RootState) => state.sharepoint);
  const [destination, setDestination] = useState<SharepointDestination>(
    (destinationId && destinations[destinationId]) || defaultDestination,
  );
  const [idempotencyText, setIdempotencyText] = useState(formatIdempotencyFields(destination.idempotencyFields));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateMapping = (index: number, mapping: Partial<SharepointFieldMapping>) =>
    setDestination((current) => ({
      ...current,
      fieldMappings: current.fieldMappings.map((existing, i) => (i === index ? { ...existing, ...mapping } : existing)),
    }));

  const save = () => {
    const idempotencyFields = parseIdempotencyFields(idempotencyText);
    const found = validateDestination({ ...destination, idempotencyFields }, Object.keys(destinations), isNew);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    const { idempotencyFields: _previous, ...rest } = destination;
    onSave({
      ...rest,
      fieldMappings: destination.fieldMappings.filter((m) => m.source && m.target),
      ...(idempotencyFields.length ? { idempotencyFields } : {}),
      enabled: destination.enabled !== false,
    });
    onCancel();
  };

  return (
    <GoabModal
      testId="destination-modal"
      open={true}
      maxWidth="760px"
      heading={isNew ? 'Add destination' : 'Edit destination'}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact" type="secondary" testId="destination-modal-cancel" onClick={onCancel}>
            Cancel
          </GoabButton>
          <GoabButton size="compact" type="primary" testId="destination-modal-save" onClick={save}>
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <ConnectionPadding>
        <GoabFormItem label="Destination name" error={errors.name}>
          <GoabInput
            size="compact"
            name="destination-name"
            testId="destination-name"
            value={destination.name}
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) =>
              setDestination((current) => ({
                ...current,
                name: detail.value,
                ...(isNew ? { id: toKebabName(detail.value) } : {}),
              }))
            }
          />
        </GoabFormItem>
      </ConnectionPadding>
      <ConnectionPadding>
        <GoabFormItem label="Destination ID" helpText="Form definitions reference this ID.">
          <GoabInput
            size="compact"
            name="destination-id"
            value={destination.id}
            disabled={true}
            width="100%"
            onChange={() => undefined}
          />
        </GoabFormItem>
      </ConnectionPadding>
      <ConnectionPadding>
        <GoabFormItem label="Connection" error={errors.connectionId}>
          <GoabDropdown
            name="destination-connection"
            testId="destination-connection"
            size="compact"
            width="100%"
            value={destination.connectionId}
            onChange={(detail: GoabDropdownOnChangeDetail) =>
              setDestination((current) => ({ ...current, connectionId: detail.value }))
            }
          >
            {Object.values(connections).map((connection) => (
              <GoabDropdownItem key={connection.id} value={connection.id} label={connection.name} />
            ))}
          </GoabDropdown>
        </GoabFormItem>
      </ConnectionPadding>
      <ConnectionPadding>
        <GoabFormItem label="SharePoint list ID" error={errors.listId}>
          <GoabInput
            size="compact"
            name="destination-list-id"
            testId="destination-list-id"
            value={destination.listId}
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) =>
              setDestination((current) => ({ ...current, listId: detail.value }))
            }
          />
        </GoabFormItem>
      </ConnectionPadding>
      <ConnectionPadding>
        <GoabFormItem
          label="Field mappings"
          error={errors.fieldMappings}
          helpText="Map a data path (for example applicant.name.first or _adsp.submittedAt) to the column's internal name, which can differ from its display name. ADSP sets AdspItemKey itself."
        >
          <MappingGrid>
            <MappingHeading>Form data path</MappingHeading>
            <MappingHeading>SharePoint column (internal name)</MappingHeading>
            <span />
            {destination.fieldMappings.map((mapping, index) => (
              <React.Fragment key={index}>
                <GoabInput
                  size="compact"
                  name={`mapping-source-${index}`}
                  testId={`mapping-source-${index}`}
                  ariaLabel={`Form data path ${index + 1}`}
                  placeholder="applicant.name.first"
                  value={mapping.source}
                  width="100%"
                  onChange={(detail: GoabInputOnChangeDetail) => updateMapping(index, { source: detail.value })}
                />
                <GoabInput
                  size="compact"
                  name={`mapping-target-${index}`}
                  testId={`mapping-target-${index}`}
                  ariaLabel={`SharePoint column ${index + 1}`}
                  placeholder="FirstName"
                  value={mapping.target}
                  width="100%"
                  onChange={(detail: GoabInputOnChangeDetail) => updateMapping(index, { target: detail.value })}
                />
                <GoabIconButton
                  icon="trash"
                  ariaLabel={`Remove mapping ${index + 1}`}
                  testId={`mapping-remove-${index}`}
                  disabled={destination.fieldMappings.length === 1}
                  onClick={() =>
                    setDestination((current) => ({
                      ...current,
                      fieldMappings: current.fieldMappings.filter((_mapping, i) => i !== index),
                    }))
                  }
                />
              </React.Fragment>
            ))}
          </MappingGrid>
          <GoabButton
            size="compact"
            type="tertiary"
            leadingIcon="add"
            testId="mapping-add"
            onClick={() =>
              setDestination((current) => ({
                ...current,
                fieldMappings: [...current.fieldMappings, { source: '', target: '' }],
              }))
            }
          >
            Add mapping
          </GoabButton>
        </GoabFormItem>
      </ConnectionPadding>
      <ConnectionPadding>
        <GoabFormItem
          label="Row identity fields"
          error={errors.idempotencyFields}
          helpText="Use _adsp.key to update the same row when a form is resubmitted. Needs an indexed AdspItemKey column. Leave empty to add a new row each time."
        >
          <GoabInput
            size="compact"
            name="destination-idempotency-fields"
            testId="destination-idempotency-fields"
            placeholder="application.number"
            value={idempotencyText}
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) => setIdempotencyText(detail.value)}
          />
        </GoabFormItem>
      </ConnectionPadding>
      <GoabFormItem
        label=""
        helpText="Turn this off to refuse pushes without deleting the destination. Tests still run."
      >
        <GoabCheckbox
          name="destination-enabled"
          testId="destination-enabled"
          text="Enabled"
          checked={destination.enabled !== false}
          onChange={(detail: GoabCheckboxOnChangeDetail) =>
            setDestination((current) => ({ ...current, enabled: detail.checked }))
          }
        />
      </GoabFormItem>
    </GoabModal>
  );
};
