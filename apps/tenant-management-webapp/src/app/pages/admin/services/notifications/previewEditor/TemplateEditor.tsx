import React, { FunctionComponent, useEffect, useState } from 'react';
import { TemplateEditorContainer, MonacoDiv, EditTemplateActions, MonacoDivBody } from './styled-components';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { languages } from 'monaco-editor';
import { buildSuggestions } from '@lib/autoComplete';
import { Template } from '@store/notification/models';
import { SaveFormModal } from './saveModal';

import { GoAInfoBadge, GoABadge } from '@abgov/react-components/experimental';
import { Tab, Tabs } from '@components/Tabs';
import { GoAButton } from '@abgov/react-components';
interface TemplateEditorProps {
  modelOpen: boolean;
  mainTitle: string;
  onSubjectChange: (value: string, channel: string) => void;
  subjectEditorHintText?: string;
  subjectTitle: string;
  subjectEditorConfig?: EditorProps;
  onBodyChange: (value: string, channel: string) => void;
  setPreview: (channel: string) => void;
  templates: Template;
  validChannels: string[];
  bodyTitle: string;
  bodyEditorConfig?: EditorProps;
  bodyEditorHintText?: string;
  saveCurrentTemplate?: () => void;
  resetToSavedAction: () => void;
  eventTemplateFormState?: { saveOrAddActionText: string; cancelOrBackActionText: string; mainTitle: string };
  savedTemplates: Template;
  initialChannel: string;
  saveAndReset: () => void;
  validateEventTemplateFields: () => boolean;
  actionButtons?: JSX.Element;
  // eslint-disable-next-line
  errors?: any;
  serviceName?: string;
  // eslint-disable-next-line
  eventSuggestion?: any;
}

export const TemplateEditor: FunctionComponent<TemplateEditorProps> = ({
  modelOpen,
  mainTitle,
  onSubjectChange,
  subjectEditorHintText,
  subjectTitle,
  subjectEditorConfig,
  onBodyChange,
  setPreview,
  templates,
  validChannels,
  bodyTitle,
  bodyEditorConfig,
  bodyEditorHintText,
  eventTemplateFormState,
  saveCurrentTemplate,
  resetToSavedAction,
  savedTemplates,
  initialChannel,
  saveAndReset,
  validateEventTemplateFields,
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [saveModal, setSaveModal] = useState(false);

  useEffect(() => {
    if (initialChannel) {
      setPreview(initialChannel);
    }
  }, [initialChannel]);

  useEffect(() => {
    if (modelOpen) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [modelOpen]);

  const switchTabPreview = (value) => {
    setPreview(value);
  };

  const tabNames = { sms: 'SMS', bot: 'Bot', email: 'Email' };
  const titleNames = { sms: ' SMS', bot: ' bot', email: 'n email' };
  const saveChangesAction = () => {
    saveCurrentTemplate();
  };

  const resetSavedAction = () => {
    resetToSavedAction();
  };

  let radioOptions = [];

  if (templates) {
    radioOptions = validChannels.map((eventKey, index) => {
      return {
        name: eventKey,
        display: tabNames[eventKey],
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
        <GoAFormItem>
          <Tabs activeIndex={activeIndex} changeTabCallback={(index: number) => switchTabPreview(validChannels[index])}>
            {radioOptions.map((item, key) => (
              <Tab
                data-testid={`${item.display}-tab`}
                key={item.name}
                label={
                  <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div>{item.display}</div>
                    <div style={{ margin: '3px 0 0 5px' }}>
                      {(savedTemplates[item.name]?.body !== templates[item.name]?.body ||
                        savedTemplates[item.name]?.subject !== templates[item.name]?.subject) &&
                      item.body?.length !== 0 &&
                      item.subject?.length !== 0 ? (
                        <div>
                          <div className="mobile">
                            <GoAInfoBadge content="" type="information" />
                          </div>
                          <div className="desktop">
                            <GoAInfoBadge content="Unsaved" type="information" />
                          </div>
                        </div>
                      ) : (
                        (item.body?.length === 0 || item.subject?.length === 0) && (
                          <div>
                            <div className="mobile">
                              <GoABadge type="warning" icon="warning" />
                            </div>
                            <div className="desktop">
                              <GoABadge type="warning" content="Unfilled" icon="warning" />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                }
              >
                <h3 data-testid="modal-title">{`${mainTitle}${
                  titleNames[item.name] || ''
                } template--${serviceName}`}</h3>

                <>
                  <h4>{subjectTitle}</h4>
                  <GoAFormItem error={errors['subject'] ?? ''} helpText={subjectEditorHintText}>
                    <MonacoDiv>
                      <MonacoEditor
                        language={item.name === 'slack' ? 'markdown' : 'handlebars'}
                        onChange={(value) => {
                          onSubjectChange(value, item.name);
                        }}
                        value={templates[item.name]?.subject}
                        {...subjectEditorConfig}
                      />
                    </MonacoDiv>
                  </GoAFormItem>
                  <h4>{bodyTitle}</h4>
                  <GoAFormItem error={errors['body'] ?? ''} helpText={bodyEditorHintText}>
                    <MonacoDivBody>
                      <MonacoEditor
                        language={item.name === 'slack' ? 'markdown' : 'handlebars'}
                        value={templates[item.name]?.body}
                        onChange={(value) => {
                          onBodyChange(value, item.name);
                        }}
                        {...bodyEditorConfig}
                      />
                    </MonacoDivBody>
                  </GoAFormItem>
                </>
              </Tab>
            ))}
          </Tabs>
        </GoAFormItem>
        <EditTemplateActions>
          {' '}
          <GoAButton
            onClick={() => {
              if (JSON.stringify(savedTemplates) !== JSON.stringify(templates)) {
                setSaveModal(true);
              } else {
                resetSavedAction();
              }
            }}
            data-testid="template-form-cancel"
            buttonType="secondary"
            type="button"
          >
            {eventTemplateFormState.cancelOrBackActionText}
          </GoAButton>
          <GoAButton
            onClick={() => saveAndReset()}
            buttonType="primary"
            data-testid="template-form-save"
            type="submit"
            disabled={!validateEventTemplateFields()}
          >
            {eventTemplateFormState.saveOrAddActionText}
          </GoAButton>
        </EditTemplateActions>
      </GoAForm>
      {/* Form */}
      <SaveFormModal
        open={saveModal}
        onDontSave={() => {
          resetSavedAction();
          setSaveModal(false);
        }}
        onSave={() => {
          saveChangesAction();
          saveAndReset();
          setSaveModal(false);
        }}
        onCancel={() => {
          setSaveModal(false);
        }}
      />
    </TemplateEditorContainer>
  );
};
