import React, { FunctionComponent, useEffect, useState } from 'react';
import { TemplateEditorContainer, MonacoDiv, EditTemplateActions, MonacoDivBody } from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { GoARadioGroup, GoARadio } from '@abgov/react-components';
import { languages } from 'monaco-editor';
import { buildSuggestions } from '@lib/autoComplete';
import { Template } from '@store/notification/models';
import { SaveFormModal } from './saveModal';
import { IndicatorWithDelay } from '@components/Indicator';
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
  saveCurrentTemplate?: () => void;
  resetToSavedAction: () => void;
  initialChannel: string;
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
  saveCurrentTemplate,
  resetToSavedAction,
  initialChannel,
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

  const [selectedTemplate, setSelectedTemplate] = useState(initialChannel);
  const [preferredTemplate, setPreferredTemplate] = useState(null);
  const [saveModal, setSaveModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState('');

  useEffect(() => {
    if (initialChannel) {
      setSelectedTemplate(initialChannel);
      setPreview(initialChannel);
    }
  }, [initialChannel]);

  const saveChangesAction = (value) => {
    saveCurrentTemplate();
    setPreview(preferredTemplate);
  };

  const resetSavedAction = () => {
    resetToSavedAction();
    setPreview(preferredTemplate);
  };

  const channelNames = { email: 'n email', bot: ' slack bot', sms: ' text message', mail: 'mail' };

  console.log(JSON.stringify(templates) + '<templates');

  let radioOptions = [];

  if (templates) {
    radioOptions = validChannels.map((eventKey, index) => {
      return {
        name: eventKey,
        subject: templates[eventKey]?.subject,
        body: templates[eventKey]?.body,
        label: eventKey,
        key: index,
        dataTestId: `${eventKey}-radio-button`,
      };
    });
  } else return null;

  return (
    <TemplateEditorContainer>
      <GoAForm>
        <h4>Select Template</h4>
        {console.log(JSON.stringify(radioOptions) + '<radioOptions')}
        {console.log(JSON.stringify(selectedTemplate) + '<selectedTemplate')}
        <GoAFormItem error={errors['body'] ?? ''} helpText={bodyEditorHintText}>
          <GoARadioGroup
            name="selectedTemplate"
            value={selectedTemplate}
            onChange={(_name, value) => {
              console.log(JSON.stringify(value) + '|xxvaluexx');
              setPreferredTemplate(value);
              setSaveModal(true);

              //setSelectedTemplate(value);
              //setPreview(value);
            }}
            orientation="horizontal"
          >
            {radioOptions.map((item, key) => (
              <GoARadio key={item.name} value={item.name} data-testid={item.dataTestId}>
                {item.name}
              </GoARadio>
            ))}
          </GoARadioGroup>
        </GoAFormItem>

        <h3 data-testid="modal-title">{`${mainTitle}${
          channelNames[selectedTemplate] || ''
        } template--${serviceName}`}</h3>

        {selectedTemplate && (
          <>
            <h4>{subjectTitle}</h4>
            <GoAFormItem error={errors['subject'] ?? ''} helpText={subjectEditorHintText}>
              <MonacoDiv>
                <MonacoEditor
                  onChange={(value) => {
                    console.log(
                      JSON.stringify(templates[selectedTemplate]?.subject) +
                        '<value - templates[selectedTemplate]?.subject'
                    );
                    console.log(JSON.stringify(currentTemplate) + '<currentTemplate');
                    console.log(JSON.stringify(selectedTemplate) + '<selectedTemplate');
                    if (currentTemplate === selectedTemplate) {
                      console.log(JSON.stringify(value) + '<this should only happen if you type inside subject');
                      onSubjectChange(value, selectedTemplate);
                    }
                    setCurrentTemplate(selectedTemplate);
                  }}
                  value={templates[selectedTemplate]?.subject}
                  {...subjectEditorConfig}
                />
              </MonacoDiv>
            </GoAFormItem>
            <h4>{bodyTitle}</h4>
            <GoAFormItem error={errors['body'] ?? ''} helpText={bodyEditorHintText}>
              <MonacoDivBody>
                <MonacoEditor
                  value={templates[selectedTemplate]?.body}
                  onChange={(value) => {
                    onBodyChange(value, selectedTemplate);
                  }}
                  {...bodyEditorConfig}
                />
              </MonacoDivBody>
            </GoAFormItem>
          </>
        )}
        <EditTemplateActions>{actionButtons}</EditTemplateActions>
      </GoAForm>

      {/* Form */}
      <SaveFormModal
        open={saveModal}
        initialValue={preferredTemplate}
        errors={errors}
        onDontSave={(type) => {
          console.log(JSON.stringify(type) + '<type2');
          resetSavedAction();
          setSelectedTemplate(preferredTemplate);
          setSaveModal(false);
        }}
        onSave={(template) => {
          console.log(JSON.stringify(template) + '<template');
          setSelectedTemplate(preferredTemplate);
          saveChangesAction(template);
          setSaveModal(false);
        }}
        onCancel={() => {
          setSaveModal(false);
        }}
      />
    </TemplateEditorContainer>
  );
};
