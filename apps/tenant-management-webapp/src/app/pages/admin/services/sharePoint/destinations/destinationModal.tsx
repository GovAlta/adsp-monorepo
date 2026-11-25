import React, { useEffect, useRef, useState } from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabCheckbox,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabModal,
} from '@abgov/react-components';
import {
  GoabCheckboxOnChangeDetail,
  GoabDropdownOnChangeDetail,
  GoabInputOnChangeDetail,
} from '@abgov/ui-components-common';
import { useDispatch, useSelector } from 'react-redux';
import { toKebabName } from '@lib/kebabName';
import { RootState } from '@store/index';
import {
  fetchSharepointForms,
  SharepointDestination,
  SharepointDetailList,
  SharepointFieldMapping,
  SharepointFormChoice,
} from '@store/sharePoint/actions';
import { ADSP_KEY_FIELD, defaultDestination } from '@store/sharePoint/model';
import { FieldLabel, InfoHint } from '../fieldLabel';
import { CheckboxRow, ConnectionPadding, FieldPair } from '../styled-components';
import { validateDestination } from './destinationHelpers';
import { DetailListsEditor } from './detailListsEditor';
import { generateFormServiceMappings } from './generateMappings';
import { MappingRows } from './mappingRows';

interface DestinationModalProps {
  destinationId: string | undefined;
  onCancel: () => void;
  onSave: (destination: SharepointDestination) => void;
}

const completeMappings = (mappings: SharepointFieldMapping[]) => mappings.filter((m) => m.source && m.target);

const trimmedOrOmitted = <K extends string>(key: K, value: string | undefined): Partial<Record<K, string>> =>
  value?.trim() ? ({ [key]: value.trim() } as Record<K, string>) : {};

// Generated detail lists keep the list ID of an existing detail list for the same array.
const mergeDetailLists = (current: SharepointDetailList[], generated: SharepointDetailList[]) =>
  generated.map((list) => {
    const existing = current.find(({ dataPath }) => dataPath === list.dataPath);
    return existing?.listId ? { ...list, listId: existing.listId } : list;
  });

export const DestinationModal = ({ destinationId, onCancel, onSave }: DestinationModalProps): JSX.Element => {
  const dispatch = useDispatch();
  const isNew = !destinationId;
  const { connections, destinations } = useSelector((state: RootState) => state.sharepoint);
  const forms = useSelector((state: RootState) => state.sharepoint.forms);
  const [destination, setDestination] = useState<SharepointDestination>(
    (destinationId && destinations[destinationId]) || defaultDestination,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formId, setFormId] = useState<string>('');
  const formRef = useRef<HTMLDivElement>(null);
  const detailLists = destination.detailLists ?? [];
  const hasDetailLists = detailLists.length > 0;

  const formChoices = [...(forms ?? [])].sort((a, b) => {
    const linked = (form: SharepointFormChoice) => (form.sharepointConfigurationId === destination.id ? 0 : 1);
    return linked(a) - linked(b) || a.name.localeCompare(b.name);
  });

  useEffect(() => {
    if (!forms) {
      dispatch(fetchSharepointForms());
    }
    // The destinations tab loads the forms in advance; only load them here if that hasn't happened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    formRef.current
      ?.querySelector('goa-form-item[error]:not([error=""])')
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }, [errors]);

  const generate = () => {
    const form = forms?.find(({ id }) => id === formId);
    if (!form) {
      return;
    }
    const generated = generateFormServiceMappings(form.dataSchema, { submissionPdf: !!form.submissionPdfTemplate });
    // Detail rows and the submission PDF are both written to the submission's row, found by its key.
    const needsRowKey = generated.detailLists.length > 0 || !!form.submissionPdfTemplate;
    setDestination((current) => ({
      ...current,
      fieldMappings: generated.fieldMappings.length ? generated.fieldMappings : current.fieldMappings,
      detailLists: mergeDetailLists(current.detailLists ?? [], generated.detailLists),
      folderLinkField: generated.folderLinkField ?? current.folderLinkField,
      idempotencyFields: needsRowKey ? [ADSP_KEY_FIELD] : current.idempotencyFields,
    }));
  };

  const save = () => {
    const found = validateDestination(destination, Object.keys(destinations), isNew);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    const {
      idempotencyFields,
      folderLinkField,
      documentFilesLibraryId,
      documentFilesLibraryName,
      detailLists: lists,
      ...rest
    } = destination;
    const savedLists = (lists ?? []).map(({ listId, listName, ...list }) => ({
      ...list,
      ...trimmedOrOmitted('listId', listId),
      ...trimmedOrOmitted('listName', listName),
      fieldMappings: completeMappings(list.fieldMappings),
    }));
    onSave({
      ...rest,
      fieldMappings: completeMappings(destination.fieldMappings),
      ...(idempotencyFields?.length ? { idempotencyFields } : {}),
      ...trimmedOrOmitted('folderLinkField', folderLinkField),
      ...trimmedOrOmitted('documentFilesLibraryId', documentFilesLibraryId),
      ...trimmedOrOmitted('documentFilesLibraryName', documentFilesLibraryName),
      ...(savedLists.length ? { detailLists: savedLists } : {}),
      enabled: destination.enabled !== false,
    });
    onCancel();
  };

  return (
    <GoabModal
      testId="destination-modal"
      open={true}
      maxWidth="900px"
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
      <div ref={formRef}>
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
          <FieldLabel label="Destination ID" hint="Callers use this ID to push data to this destination." />
          <GoabFormItem label="">
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
          <FieldLabel
            label="Generate Form Service mappings"
            hint="Optional. Fills in the mappings, detail lists and column types below from a form's data schema."
          />
          <GoabFormItem label="">
            <CheckboxRow>
              <GoabDropdown
                name="generate-form"
                testId="generate-form"
                size="compact"
                width="40ch"
                placeholder={forms ? 'Choose or search for a form' : 'Loading forms…'}
                filterable={true}
                disabled={!forms}
                value={formId}
                onChange={(detail: GoabDropdownOnChangeDetail) => setFormId(detail.value)}
              >
                {formChoices.map((form) => (
                  <GoabDropdownItem
                    key={form.id}
                    value={form.id}
                    label={
                      form.sharepointConfigurationId === destination.id && destination.id
                        ? `${form.name} (linked)`
                        : form.name
                    }
                  />
                ))}
              </GoabDropdown>
              <GoabButton
                size="compact"
                type="secondary"
                testId="generate-mappings"
                disabled={!formId}
                onClick={generate}
              >
                Generate Form Service mappings
              </GoabButton>
            </CheckboxRow>
          </GoabFormItem>
        </ConnectionPadding>
        <ConnectionPadding>
          <FieldLabel
            label="Field mappings"
            hint="Map a form data path to a SharePoint column, for example applicant.name.first to FirstName."
          />
          <GoabFormItem label="" error={errors.fieldMappings}>
            <MappingRows
              prefix="mapping"
              label="Field"
              mappings={destination.fieldMappings}
              onChange={(update) =>
                setDestination((current) => ({ ...current, fieldMappings: update(current.fieldMappings) }))
              }
            />
          </GoabFormItem>
        </ConnectionPadding>
        <ConnectionPadding>
          <FieldLabel
            label="Detail lists"
            hint="For repeating sections. Each section is a sub list with each section item as a row in the sub list."
          />
          <DetailListsEditor
            detailLists={detailLists}
            error={errors.detailLists}
            onChange={(update) =>
              setDestination((current) => {
                const lists = update(current.detailLists ?? []);
                const keepsRows = lists.length > 0 && !current.idempotencyFields?.length;
                return {
                  ...current,
                  detailLists: lists,
                  ...(keepsRows ? { idempotencyFields: [ADSP_KEY_FIELD] } : {}),
                };
              })
            }
          />
        </ConnectionPadding>
        <ConnectionPadding>
          <FieldPair>
            <div>
              <FieldLabel
                label="Document library name (optional)"
                hint="Verify setup creates a document library with this name when there is no document library ID."
              />
              <GoabFormItem label="">
                <GoabInput
                  size="compact"
                  name="destination-library-name"
                  testId="destination-library-name"
                  value={destination.documentFilesLibraryName ?? ''}
                  width="100%"
                  onChange={(detail: GoabInputOnChangeDetail) =>
                    setDestination((current) => ({ ...current, documentFilesLibraryName: detail.value }))
                  }
                />
              </GoabFormItem>
            </div>
            <div>
              <FieldLabel
                label="Document library ID (optional)"
                hint="The document library for uploaded files. Files go to the site's Documents library when this and the name are empty."
              />
              <GoabFormItem label="">
                <GoabInput
                  size="compact"
                  name="destination-library-id"
                  testId="destination-library-id"
                  value={destination.documentFilesLibraryId ?? ''}
                  width="100%"
                  onChange={(detail: GoabInputOnChangeDetail) =>
                    setDestination((current) => ({ ...current, documentFilesLibraryId: detail.value }))
                  }
                />
              </GoabFormItem>
            </div>
          </FieldPair>
        </ConnectionPadding>
        <ConnectionPadding>
          <FieldLabel
            label="Files folder link column (optional)"
            hint="A Hyperlink column on the main list that links to the folder of files uploaded with each submission."
          />
          <GoabFormItem label="">
            <GoabInput
              size="compact"
              name="destination-folder-link"
              testId="destination-folder-link"
              value={destination.folderLinkField ?? ''}
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) =>
                setDestination((current) => ({ ...current, folderLinkField: detail.value }))
              }
            />
          </GoabFormItem>
        </ConnectionPadding>
        <CheckboxRow>
          <GoabCheckbox
            name="destination-updates-rows"
            testId="destination-updates-rows"
            text="Update existing rows (requires an indexed AdspItemKey column)"
            checked={!!destination.idempotencyFields?.length}
            disabled={hasDetailLists}
            onChange={(detail: GoabCheckboxOnChangeDetail) =>
              setDestination((current) => ({ ...current, idempotencyFields: detail.checked ? [ADSP_KEY_FIELD] : [] }))
            }
          />
          {hasDetailLists && (
            <InfoHint
              label="Update existing rows"
              hint="Always on with detail lists, so a retried push replaces the detail rows instead of adding a second set."
            />
          )}
        </CheckboxRow>
        <CheckboxRow>
          <GoabCheckbox
            name="destination-enabled"
            testId="destination-enabled"
            text="Enabled"
            checked={destination.enabled !== false}
            onChange={(detail: GoabCheckboxOnChangeDetail) =>
              setDestination((current) => ({ ...current, enabled: detail.checked }))
            }
          />
          <InfoHint label="Enabled" hint="Disable pushing data to destination. Test actions can still push data." />
        </CheckboxRow>
      </div>
    </GoabModal>
  );
};
