import {
  GoAButton,
  GoAButtonGroup,
  GoAModal,
  GoAInput,
  GoAFormItem,
  GoATextArea,
  GoADropdown,
  GoADropdownItem,
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

interface AddEditToolModalProps {
  tool: ApiToolConfiguration;
  onCancel: () => void;
  onOK: (tool: ApiToolConfiguration) => void;
  open: boolean;
}

export const AddEditToolModal: FunctionComponent<AddEditToolModalProps> = ({
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
    <GoAModal
      testId="add-edit-tool-modal"
      open={open}
      heading={`${initialValue?.id ? 'Edit' : 'Add'} tool`}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="tool-modal-cancel"
            onClick={() => {
              onCancel();
              validators.clear();
            }}
          >
            Cancel
          </GoAButton>

          <GoAButton
            type="primary"
            testId="tool-modal-save"
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
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <form>
        <GoAFormItem error={errors?.['id']} label="Tool ID" mb="m">
          <GoAInput
            type="text"
            name="id"
            value={tool.id}
            testId="tool-modal-id-input"
            aria-label="id"
            width="100%"
            onChange={(_, value) => {
              validators.remove('id');
              validators['id'].check(value);
              setTool({ ...tool, id: value });
            }}
          />
        </GoAFormItem>
        <GoAFormItem error={errors?.['description']} label="Description" mb="m">
          <GoATextArea
            name="description"
            value={tool.description}
            testId="tool-modal-description-input"
            aria-label="description"
            width="100%"
            onChange={(_, value) => {
              validators.remove('description');
              validators['description'].check(value);
              setTool({ ...tool, description: value });
            }}
          />
          <HelpTextComponent
            length={tool.description?.length || 0}
            maxLength={250}
            descErrMessage="Tool description can not be over 250 characters"
            errorMsg={errors?.['description']}
          />
        </GoAFormItem>
        <GoAFormItem label="Method" mb="m">
          <GoADropdown
            testId="tool-modal-method-input"
            ariaLabel="method"
            value={tool.method}
            onChange={(_, value) => setTool({ ...tool, method: value as string })}
          >
            <GoADropdownItem value="GET" />
            <GoADropdownItem value="PUT" />
            <GoADropdownItem value="PATCH" />
          </GoADropdown>
        </GoAFormItem>
        <GoAFormItem error={errors?.['api']} label="Api" mb="m">
          <GoADropdown
            name="api"
            value={tool.api}
            aria-label="api"
            width="100%"
            testId="tool-modal-api-input"
            onChange={(_, value) => {
              validators.remove('api');
              validators['api'].check(value);
              setTool({ ...tool, api: value as string });
            }}
            relative={true}
          >
            {coreDirectory
              ?.filter(({ api }) => !!api)
              .map(({ urn }) => (
                <GoADropdownItem key={urn} value={urn} label={urn} />
              ))}
            {tenantDirectory
              ?.filter(({ api }) => !!api)
              .map(({ urn }) => (
                <GoADropdownItem key={urn} value={urn} label={urn} />
              ))}
          </GoADropdown>
        </GoAFormItem>
        <GoAFormItem error={errors?.['path']} label="Path" mb="m">
          <GoAInput
            type="text"
            name="path"
            value={tool.path}
            testId="tool-modal-path-input"
            aria-label="path"
            width="100%"
            onChange={(_, value) => {
              validators.remove('path');
              validators['path'].check(value);
              setTool({ ...tool, path: value });
            }}
          />
        </GoAFormItem>
        <GoAFormItem error={errors?.['inputSchema']} label="Input schema" mb="m">
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
        </GoAFormItem>
        <GoAFormItem error={errors?.['outputSchema']} label="Output schema" mb="m">
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
        </GoAFormItem>
      </form>
    </GoAModal>
  );
};
