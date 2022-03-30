import React, { FunctionComponent, useEffect, useState } from 'react';
import { TemplateEditorContainer, MonacoDiv, EditTemplateActions, MonacoDivBody } from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { languages } from 'monaco-editor';
import { buildSuggestions } from '@lib/autoComplete';
import { Template } from '@store/notification/models';
interface TemplateEditorProps {
  mainTitle: string;
  onSubjectChange: (value: string, channel: string) => void;
  //subject: string;
  subjectEditorHintText?: string;
  subjectTitle: string;
  subjectEditorConfig?: EditorProps;
  onBodyChange: (value: string, channel: string) => void;
  setPreview: (channel: string) => void;
  //body: string;
  templates: Template;
  validChannels: string[];
  bodyTitle: string;
  bodyEditorConfig?: EditorProps;
  bodyEditorHintText?: string;
  actionButtons?: JSX.Element;
  // eslint-disable-next-line
  errors?: any;
  serviceName?: string;
  // eslint-disable-next-line
  eventSuggestion?: any;
}

export const TemplateEditor: FunctionComponent<TemplateEditorProps> = ({
  mainTitle,
  onSubjectChange,
  //subject,
  subjectEditorHintText,
  subjectTitle,
  subjectEditorConfig,
  onBodyChange,
  setPreview,
  templates,
  validChannels,
  //body,
  bodyTitle,
  bodyEditorConfig,
  bodyEditorHintText,
  actionButtons,
  errors,
  serviceName,
  eventSuggestion,
}) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      const provider = monaco.languages.registerCompletionItemProvider('handlebars', {
        triggerCharacters: ['{{', '.'],
        provideCompletionItems: (model, position) => {
          const suggestions = buildSuggestions(monaco, eventSuggestion, model, position);
          return {
            suggestions,
          } as languages.ProviderResult<languages.CompletionList>;
        },
      });
      return function cleanup() {
        provider.dispose();
      };
    }
  }, [monaco, eventSuggestion]);

  console.log(JSON.stringify(validChannels) + '<validChannels');

  const [templateChange, setTemplateChange] = useState([validChannels[0]]);

  useEffect(() => {
    if (validChannels.length > 0) {
      setTemplateChange([validChannels[0]]);
      setPreview(validChannels[0]);
    }
  }, [validChannels]);

  const channels = [
    { value: 'email', title: 'Email' },
    { value: 'bot', title: 'Slack bot' },
    { value: 'sms', title: 'Text Message' },
    { value: 'mail', title: 'Mail' },
  ];

  console.log(JSON.stringify(templates) + '<templates');

  let dropDownOptions = [];

  if (templates) {
    dropDownOptions = validChannels.map((eventKey, index) => {
      // console.log(JSON.stringify(dropDownOptions) + '>dropDownOptions');
      // console.log(JSON.stringify(eventKey) + '>eventKey');
      // console.log(JSON.stringify(Object.keys(templates)) + '>Object.keys(templates)');
      // console.log(JSON.stringify(templates) + '>templates');
      return {
        name: eventKey,
        subject: templates[eventKey]?.subject,
        body: templates[eventKey]?.body,
        label: eventKey,
        key: index,
        dataTestId: `${eventKey}-dropdown`,
      };
    });
  } else return null;

  return (
    <TemplateEditorContainer>
      <h3 data-testid="modal-title">{`${mainTitle}--${serviceName}`}</h3>
      <GoAForm>
        <h4>Template Type</h4>
        {console.log(JSON.stringify(dropDownOptions) + '<dropDownOptions')}
        {console.log(JSON.stringify(templateChange) + '<templateChange')}
        <GoAFormItem error={errors['body'] ?? ''} helpText={bodyEditorHintText}>
          <GoADropdown
            name="channels"
            onChange={(_name, value) => {
              console.log(JSON.stringify(value) + '|value');
              setTemplateChange(value);
              setPreview(value[0]);
            }}
            selectedValues={templateChange}
          >
            {dropDownOptions.map((item, key) => (
              <GoADropdownOption label={item.label} value={item.name} key={key} data-testid={item.dataTestId} />
            ))}
          </GoADropdown>
        </GoAFormItem>
        <h4>{subjectTitle}</h4>
        <GoAFormItem error={errors['subject'] ?? ''} helpText={subjectEditorHintText}>
          <MonacoDiv>
            <MonacoEditor
              onChange={(value) => {
                onSubjectChange(value, templateChange[0]);
              }}
              value={templates[templateChange[0]]?.subject}
              {...subjectEditorConfig}
            />
          </MonacoDiv>
        </GoAFormItem>
        <h4>{bodyTitle}</h4>
        <GoAFormItem error={errors['body'] ?? ''} helpText={bodyEditorHintText}>
          <MonacoDivBody>
            <MonacoEditor
              value={templates[templateChange[0]]?.body}
              onChange={(value) => {
                onBodyChange(value, templateChange[0]);
              }}
              {...bodyEditorConfig}
            />
          </MonacoDivBody>
        </GoAFormItem>
        <EditTemplateActions>{actionButtons}</EditTemplateActions>
      </GoAForm>
    </TemplateEditorContainer>
  );
};
