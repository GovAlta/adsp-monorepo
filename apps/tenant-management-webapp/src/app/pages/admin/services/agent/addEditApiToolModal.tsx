import {
  GoabButton,
  GoabButtonGroup,
  GoabModal,
  GoabInput,
  GoabFormItem,
  GoabTextArea,
  GoabDropdown,
  GoabDropdownItem,
} from '@abgov/react-components';
import { useState, FunctionComponent, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { HelpTextComponent } from '@components/HelpTextComponent';
import {
  isNotEmptyCheck,
  isValidJSONCheck,
  wordMaxLengthCheck,
  badCharsCheckNoSpace,
  duplicateNameCheck,
} from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';
import { ApiToolConfiguration } from '@store/agent/model';
import { selectSortedDirectory } from '@store/directory/selectors';
import { useSelector } from 'react-redux';
import {
  GoabTextAreaOnChangeDetail,
  GoabInputOnChangeDetail,
  GoabDropdownOnChangeDetail,
} from '@abgov/ui-components-common';
interface AddEditApiToolModalProps {
  tool: ApiToolConfiguration;
  onCancel: () => void;
  onOK: (tool: ApiToolConfiguration) => void;
  open: boolean;
}

export const AddEditApiToolModal: FunctionComponent<AddEditApiToolModalProps> = ({
  tool: initialValue,
  onCancel,
  onOK,
  open,
}) => {
  const { coreDirectory, tenantDirectory } = useSelector(selectSortedDirectory);

  const [tool, setTool] = useState<Partial<ApiToolConfiguration>>({});
  const [inputSchema, setInputSchema] = useState<string>('');
  const [outputSchema, setOutputSchema] = useState<string>('');

  useEffect(() => {
    if (initialValue) {
      setTool(initialValue);
      setInputSchema(JSON.stringify(initialValue.inputSchema, null, 2));
      setOutputSchema(JSON.stringify(initialValue.outputSchema, null, 2));
    }
  }, [initialValue]);

  const { errors, validators } = useValidators(
    'id',
    'id',
    badCharsCheckNoSpace,
    wordMaxLengthCheck(50, 'ID'),
    isNotEmptyCheck('id')
  )
    // .add('duplicated', 'name', duplicateNameCheck(identifiers, 'Event'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'), isNotEmptyCheck('description'))
    .add('api', 'api', isNotEmptyCheck('api'))
    .add('path', 'path', wordMaxLengthCheck(250, 'Path'), isNotEmptyCheck('path'))
    .add('inputSchema', 'inputSchema', isValidJSONCheck('inputSchema'))
    .add('outputSchema', 'outputSchema', isValidJSONCheck('outputSchema'))
    .build();

  return (
    <GoabModal
      testId="add-edit-tool-modal"
      open={open}
      heading={`${initialValue?.id ? 'Edit' : 'Add'} API tool`}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="api-tool-modal-cancel"
            onClick={() => {
              onCancel();
              validators.clear();
            }}
          >
            Cancel
          </GoabButton>

          <GoabButton
            type="primary"
            testId="api-tool-modal-save"
            disabled={!tool.id || validators.haveErrors()}
            onClick={() => {
              if (!validators.checkAll({ ...tool, inputSchema, outputSchema })) {
                return;
              }

              onOK({
                ...tool,
                inputSchema: JSON.parse(inputSchema),
                outputSchema: JSON.parse(outputSchema),
              });
              validators.clear();
            }}
          >
            OK
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <form>
        <GoabFormItem error={errors?.['id']} label="Tool ID" mb="m">
          <GoabInput
            type="text"
            name="id"
            value={tool.id}
            testId="api-tool-modal-id-input"
            aria-label="id"
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) => {
              validators.remove('id');
              validators['id'].check(detail.value);
              setTool({ ...tool, id: detail.value });
            }}
          />
        </GoabFormItem>
        <GoabFormItem error={errors?.['description']} label="Description" mb="m">
          <GoabTextArea
            name="description"
            value={tool.description}
            testId="api-tool-modal-description-input"
            aria-label="description"
            width="100%"
            onChange={(detail: GoabTextAreaOnChangeDetail) => {
              validators.remove('description');
              validators['description'].check(detail.value);
              setTool({ ...tool, description: detail.value });
            }}
          />
          <HelpTextComponent
            length={tool.description?.length || 0}
            maxLength={250}
            descErrMessage="Tool description can not be over 250 characters"
            errorMsg={errors?.['description']}
          />
        </GoabFormItem>
        <GoabFormItem label="Method" mb="m">
          <GoabDropdown
            testId="api-tool-modal-method-input"
            ariaLabel="method"
            value={tool.method}
            onChange={(detail: GoabDropdownOnChangeDetail) => setTool({ ...tool, method: detail.value as string })}
          >
            <GoabDropdownItem value="GET" />
            <GoabDropdownItem value="PUT" />
            <GoabDropdownItem value="PATCH" />
          </GoabDropdown>
        </GoabFormItem>
        <GoabFormItem error={errors?.['api']} label="Api" mb="m">
          <GoabDropdown
            name="api"
            value={tool.api}
            aria-label="api"
            width="100%"
            testId="api-tool-modal-api-input"
            onChange={(detail: GoabDropdownOnChangeDetail) => {
              validators.remove('api');
              validators['api'].check(detail.value);
              setTool({ ...tool, api: detail.value as string });
            }}
          >
            {coreDirectory
              ?.filter(({ api }) => !!api)
              .map(({ urn }) => (
                <GoabDropdownItem key={urn} value={urn} label={urn} />
              ))}
            {tenantDirectory
              ?.filter(({ api }) => !!api)
              .map(({ urn }) => (
                <GoabDropdownItem key={urn} value={urn} label={urn} />
              ))}
          </GoabDropdown>
        </GoabFormItem>
        <GoabFormItem error={errors?.['path']} label="Path" mb="m">
          <GoabInput
            type="text"
            name="path"
            value={tool.path}
            testId="api-tool-modal-path-input"
            aria-label="path"
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) => {
              validators.remove('path');
              validators['path'].check(detail.value);
              setTool({ ...tool, path: detail.value });
            }}
          />
        </GoabFormItem>
        <GoabFormItem error={errors?.['inputSchema']} label="Input schema" mb="m">
          <Editor
            data-testid="tool-input-schema"
            height={200}
            value={inputSchema}
            onChange={(value) => {
              validators.remove('inputSchema');
              validators['inputSchema'].check(value);
              setInputSchema(value || '');
            }}
            width="99%"
            language="json"
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              minimap: { enabled: false },
              folding: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
            }}
          />
        </GoabFormItem>
        <GoabFormItem error={errors?.['outputSchema']} label="Output schema" mb="m">
          <Editor
            data-testid="tool-output-schema"
            height={200}
            value={outputSchema}
            onChange={(value) => {
              validators.remove('outputSchema');
              validators['outputSchema'].check(value);
              setOutputSchema(value || '');
            }}
            width="99%"
            language="json"
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              minimap: { enabled: false },
              folding: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
            }}
          />
        </GoabFormItem>
      </form>
    </GoabModal>
  );
};
