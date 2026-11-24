import * as React from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabCallout,
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
  getSeparatorHelpText,
  REGISTER_NAME_PATTERN,
  RegisterDataSeparator,
  SEPARATOR_MAPPER,
  validateRegisterJson,
  validateSeparatorMatch,
} from './utils';
import { RegisterDataType } from '@abgov/jsonforms-components';

interface AddRegisterDataModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (data: RegisterDataType | null, name: string, description: string, anonymousRead: boolean) => void;
  existingNames?: string[];
}

export const AddRegisterDataModal = ({
  open,
  onCancel,
  onSave,
  existingNames = [],
}: AddRegisterDataModalProps): JSX.Element => {
  const [dataError, setDataError] = React.useState('');
  const [parsedData, setParsedData] = React.useState<RegisterDataType | null>(null);
  const [separator, setSeparator] = React.useState<RegisterDataSeparator>('comma');
  const [configValue, setConfigValue] = React.useState<string>('');
  const [newName, setNewName] = React.useState('');
  const [newDescription, onDescriptionChange] = React.useState('');
  const [anonymousRead, setAnonymousRead] = React.useState(false);

  const resetState = () => {
    setDataError('');
    setParsedData(null);
    setSeparator('comma');
    setConfigValue('');
    setNewName('');
    onDescriptionChange('');
    setAnonymousRead(false);
  };

  const trimmedName = newName.trim();
  const nameError = !trimmedName
    ? ''
    : !REGISTER_NAME_PATTERN.test(trimmedName)
      ? 'Name may only contain letters, numbers, spaces, hyphens and underscores.'
      : existingNames.includes(trimmedName)
        ? `A register named "${trimmedName}" already exists.`
        : '';

  const parseDataBySeparator = (
    value: string,
    selectedSeparator: Exclude<RegisterDataSeparator, 'json'>,
  ): string[] | null => {
    let trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    if (selectedSeparator !== 'newline') {
      trimmedValue = trimmedValue.replace(/\n/g, '');
    }

    try {
      const splitPattern = SEPARATOR_MAPPER[selectedSeparator];
      return trimmedValue.split(splitPattern).filter((item) => item.trim() !== '');
    } catch (error) {
      setDataError(`Error parsing data: ${error}`);
      return null;
    }
  };

  const parseAndSet = (value: string, selectedSeparator: RegisterDataSeparator) => {
    if (!value.trim()) {
      setParsedData(null);
      setDataError('');
      return;
    }
    if (selectedSeparator === 'json') {
      const errorMessage = validateRegisterJson(value);
      if (errorMessage) {
        setDataError(errorMessage);
        setParsedData(null);
      } else {
        setDataError('');
        setParsedData(JSON.parse(value) as RegisterDataType);
      }
    } else {
      const mismatchError = validateSeparatorMatch(value, selectedSeparator);
      if (mismatchError) {
        setDataError(mismatchError);
        setParsedData(null);
      } else {
        setDataError('');
        setParsedData(parseDataBySeparator(value, selectedSeparator));
      }
    }
  };

  const handleDataChange = (value: string) => {
    setConfigValue(value);
    if (dataError) {
      setDataError('');
    }
  };

  return (
    <GoabModal
      heading="Add register data"
      open={open}
      testId="data-register-add-modal"
      maxWidth="500px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact"
            type="secondary"
            onClick={() => {
              onCancel();
              resetState();
            }}
            testId="data-register-add-cancel"
          >
            Cancel
          </GoabButton>
          <GoabButton size="compact"
            type="primary"
            onClick={() => {
              onSave(parsedData, trimmedName, newDescription, anonymousRead);
              resetState();
            }}
            disabled={!trimmedName || !!nameError || !!dataError}
            testId="data-register-add-save"
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem label="Name" error={nameError}>
        <GoabInput size="compact"
          width="100%"
          name="register-name"
          value={newName}
          onChange={(detail: GoabInputOnChangeDetail) => setNewName(detail.value)}
          testId="data-register-add-name-input"
          mb="l"
        />
      </GoabFormItem>
      <GoabFormItem label="Description">
        <GoabTextArea
          name="register-description"
          value={newDescription}
          rows={2}
          width="100%"
          testId="data-register-add-description-input"
          onChange={(detail: GoabTextAreaOnChangeDetail) => onDescriptionChange(detail.value)}
        />
      </GoabFormItem>
      <GoabFormItem label="Register data" mt="m" mb="m">
        <GoabDropdown size="compact"
          name="register-data-separator"
          value={separator}
          testId="data-register-add-data-separator"
          onChange={(detail: GoabDropdownOnChangeDetail) => {
            const newSeparator = detail.value as RegisterDataSeparator;
            setSeparator(newSeparator);
            parseAndSet(configValue, newSeparator);
          }}
          width="100%"
        >
          <GoabDropdownItem value="comma" label="Use comma as separator" />
          <GoabDropdownItem value="newline" label="Use new line as separator" />
          <GoabDropdownItem value="semicolon" label="Use semicolon as separator" />
          <GoabDropdownItem value="json" label="Use JSON format" />
        </GoabDropdown>
      </GoabFormItem>
      <GoabFormItem
        label=""
        helpText={getSeparatorHelpText(separator)}
        error={dataError}
        testId="data-register-add-data-formitem"
      >
        <GoabTextArea
          name="register-data"
          value={configValue}
          width="100%"
          testId="data-register-add-data-input"
          onChange={(detail: GoabTextAreaOnChangeDetail) => handleDataChange(detail.value)}
          onBlur={() => parseAndSet(configValue, separator)}
        />
      </GoabFormItem>
      <GoabFormItem
        label=""
        mt="m"
        helpText="Lets anonymous applicants and other apps read this register without signing in. Leave unchecked to keep it private to signed-in users of this tenant."
      >
        <GoabCheckbox
          size="compact"
          name="register-anonymous-read"
          checked={anonymousRead}
          text="Allow anonymous access"
          testId="data-register-add-anonymous-read"
          ariaLabel="anonymous-read"
          onChange={(detail: GoabCheckboxOnChangeDetail) => setAnonymousRead(detail.checked)}
        />
      </GoabFormItem>
      {anonymousRead && (
        <GoabCallout type="important" size="medium" mt="s" testId="data-register-add-anonymous-warning">
          Anyone who knows your tenant and this register's name can read its entries without signing in. Don't include
          sensitive information.
        </GoabCallout>
      )}
    </GoabModal>
  );
};
