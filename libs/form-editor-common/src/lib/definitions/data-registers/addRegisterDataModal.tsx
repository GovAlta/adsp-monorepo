import * as React from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabModal,
  GoabTextArea,
} from '@abgov/react-components';
import {
  GoabDropdownOnChangeDetail,
  GoabInputOnChangeDetail,
  GoabTextAreaOnKeyPressDetail,
} from '@abgov/ui-components-common';
import { validateRegisterJson } from './utils';
import { RegisterDataType } from '@abgov/jsonforms-components';

export type RegisterDataSeparator = 'comma' | 'newline' | 'semicolon' | 'json';
const SEPARATOR_MAPPER = {
  comma: ',',
  newline: '\n',
  semicolon: ';',
};
interface AddRegisterDataModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (data: RegisterDataType | null, name: string, description: string) => void;
}

export const AddRegisterDataModal = ({ open, onCancel, onSave }: AddRegisterDataModalProps): JSX.Element => {
  const [dataError, setDataError] = React.useState('');
  const [parsedData, setParsedData] = React.useState<RegisterDataType | null>(null);
  const [separator, setSeparator] = React.useState<RegisterDataSeparator>('comma');
  const [configValue, setConfigValue] = React.useState<string>('');
  const [newName, onNameChange] = React.useState('');
  const [newDescription, onDescriptionChange] = React.useState('');

  const parseDataBySeparator = (value: string, selectedSeparator: RegisterDataSeparator): string[] | null => {
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

  const handleDataChange = (value: string) => {
    setConfigValue(value);
    if (dataError) {
      setDataError(null);
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
          <GoabButton type="secondary" onClick={onCancel} testId="data-register-add-cancel">
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            onClick={() => {
              onSave(parsedData, newName, newDescription);
            }}
            disabled={!newName.trim() || !!dataError}
            testId="data-register-add-save"
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem label="Name">
        <GoabInput
          width="100%"
          name="register-name"
          value={newName}
          onChange={(detail: GoabInputOnChangeDetail) => onNameChange(detail.value)}
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
          onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => onDescriptionChange(detail.value)}
        />
      </GoabFormItem>
      <GoabFormItem label="Register data" mt="m" mb="m">
        <GoabDropdown
          name="register-data-separator"
          value={separator}
          testId="data-register-add-data-separator"
          onChange={(detail: GoabDropdownOnChangeDetail) => {
            setSeparator(detail.value as RegisterDataSeparator);
            if (dataError) {
              setDataError('');
            }
          }}
          width="100%"
        >
          <GoabDropdownItem value="comma" label="Use comma as separator" />
          <GoabDropdownItem value="newline" label="Use new line as separator" />
          <GoabDropdownItem value="semicolon" label="Use semicolon as separator" />
          <GoabDropdownItem value="json" label="Use JSON format" />
        </GoabDropdown>
      </GoabFormItem>
      <GoabFormItem label="" error={dataError}>
        <GoabTextArea
          name="register-data"
          value={configValue}
          width="100%"
          testId="data-register-add-data-input"
          onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => handleDataChange(detail.value)}
          onBlur={() => {
            if (separator !== 'json') {
              const parsedConfig = parseDataBySeparator(configValue, separator);
              setParsedData(parsedConfig);
            } else {
              const errorMessage = validateRegisterJson(configValue);
              if (errorMessage) {
                setDataError(errorMessage);
                setParsedData(null);
              } else {
                setParsedData(JSON.parse(configValue) as RegisterDataType);
              }
            }
          }}
        />
      </GoabFormItem>
    </GoabModal>
  );
};
