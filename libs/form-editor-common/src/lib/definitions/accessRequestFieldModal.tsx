import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabCheckbox,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabModal,
  GoabTextArea,
} from '@abgov/react-components';
import {
  GoabCheckboxOnChangeDetail,
  GoabDropdownOnChangeDetail,
  GoabInputOnChangeDetail,
  GoabTextAreaOnChangeDetail,
} from '@abgov/ui-components-common';
import {
  ACCESS_REQUEST_FIELD_TYPES,
  AccessRequestField,
  AccessRequestFieldType,
  emptyAccessRequestField,
  hasErrors,
  parseOptions,
  validateAccessRequestField,
} from './accessRequestFields';

interface AccessRequestFieldModalProps {
  open: boolean;
  // The question being edited; a new question is added when not set.
  field?: AccessRequestField;
  otherNames: string[];
  onSave: (field: AccessRequestField) => void;
  onCancel: () => void;
}

export const AccessRequestFieldModal: FunctionComponent<AccessRequestFieldModalProps> = ({
  open,
  field,
  otherNames,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<AccessRequestField>(field || emptyAccessRequestField());
  // Kept as typed so a new line can be started; parsed into options on every change.
  const [optionsText, setOptionsText] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      const initial = field || emptyAccessRequestField();
      setDraft(initial);
      setOptionsText(initial.options.join('\n'));
      setShowErrors(false);
    }
  }, [open, field]);

  const errors = validateAccessRequestField(draft, otherNames);
  const shownErrors = showErrors ? errors : {};

  const save = () => {
    if (hasErrors(errors)) {
      setShowErrors(true);
      return;
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      label: draft.label.trim(),
      options: draft.type === 'selection' ? draft.options : [],
    });
  };

  return (
    <GoabModal
      testId="access-request-field-modal"
      open={open}
      heading={field ? 'Edit question' : 'Add question'}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact" type="secondary" testId="access-request-field-cancel" onClick={onCancel}>
            Cancel
          </GoabButton>
          <GoabButton size="compact" type="primary" testId="access-request-field-save" onClick={save}>
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem
        label="Name"
        error={shownErrors.name}
        helpText="Saved with the answer, for example licenceNumber. Letters, numbers and underscores."
      >
        <GoabInput
          name="access-request-field-name"
          testId="access-request-field-name"
          size="compact"
          width="100%"
          value={draft.name}
          onChange={(detail: GoabInputOnChangeDetail) => setDraft({ ...draft, name: detail.value })}
        />
      </GoabFormItem>
      <GoabFormItem label="Label" error={shownErrors.label} helpText="What the applicant sees." mt="m">
        <GoabInput
          name="access-request-field-label"
          testId="access-request-field-label"
          size="compact"
          width="100%"
          value={draft.label}
          onChange={(detail: GoabInputOnChangeDetail) => setDraft({ ...draft, label: detail.value })}
        />
      </GoabFormItem>
      <GoabFormItem label="Type" mt="m">
        <GoabDropdown
          name="access-request-field-type"
          testId="access-request-field-type"
          size="compact"
          width="100%"
          value={draft.type}
          onChange={(detail: GoabDropdownOnChangeDetail) =>
            setDraft({ ...draft, type: (detail.value as AccessRequestFieldType) || 'text' })
          }
        >
          {ACCESS_REQUEST_FIELD_TYPES.map(({ value, label }) => (
            <GoabDropdownItem key={value} value={value} label={label} />
          ))}
        </GoabDropdown>
      </GoabFormItem>
      {draft.type === 'selection' && (
        <GoabFormItem label="Options" error={shownErrors.options} helpText="One option per line." mt="m">
          <GoabTextArea
            name="access-request-field-options"
            testId="access-request-field-options"
            width="100%"
            rows={4}
            value={optionsText}
            onChange={(detail: GoabTextAreaOnChangeDetail) => {
              setOptionsText(detail.value);
              setDraft({ ...draft, options: parseOptions(detail.value) });
            }}
          />
        </GoabFormItem>
      )}
      <GoabFormItem label="" mt="m">
        <GoabCheckbox
          name="access-request-field-required"
          testId="access-request-field-required"
          text={draft.type === 'checkbox' ? 'Required (the applicant must tick it)' : 'Required'}
          checked={draft.required}
          onChange={(detail: GoabCheckboxOnChangeDetail) => setDraft({ ...draft, required: detail.checked })}
        />
      </GoabFormItem>
    </GoabModal>
  );
};
