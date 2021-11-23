import React, { FunctionComponent, useState, useEffect } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { EventItem } from '@store/notification/models';
import MonacoEditor from '@monaco-editor/react';
import styled from 'styled-components';

interface TemplateFormProps {
  onCancel?: () => void;
  onSubmit?: (NotificationItem) => void;
  open: boolean;
  initialValue?: NotificationItem;
  selectedEvent: EventItem;
  notifications: NotificationItem;
  errors?: Record<string, string>;
  disabled: boolean;
}

export const TemplateForm: FunctionComponent<TemplateFormProps> = ({
  onCancel,
  onSubmit,
  notifications,
  open,
  selectedEvent,
  disabled,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (selectedEvent) {
      setSubject(selectedEvent?.templates?.email?.subject);
      setBody(selectedEvent?.templates?.email?.body);
    }
  }, [selectedEvent, open]);
  const validate = () => {
    if (subject.length === 0 || body.length === 0) {
      return false;
    }
    return true;
  };
  const getModalState = () => {
    if (disabled) {
      return 'Preview';
    }
    if (!selectedEvent) {
      return 'Add';
    }
    return selectedEvent?.templates?.email?.body?.length === 0 && selectedEvent?.templates?.email?.subject?.length === 0
      ? 'Add'
      : 'Save';
  };
  return (
    <GoAModal testId="template-form" isOpen={open}>
      <GoAModalTitle>{`${getModalState()} an email template`}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem>
            <label>Subject</label>
            <MonacoDiv>
              <MonacoEditor
                data-testid="templateForm-subject"
                height={50}
                width="80vh"
                language="handlebars"
                value={subject}
                onChange={(value) => setSubject(value)}
                options={{
                  wordWrap: 'off',
                  lineNumbers: 'off',
                  readOnly: disabled,
                  scrollbar: { horizontal: 'hidden', vertical: 'hidden' },
                  find: {
                    addExtraSpaceOnTop: false,
                    autoFindInSelection: 'never',
                    seedSearchStringFromSelection: false,
                    overviewRulerBorder: false,
                  },
                  minimap: { enabled: false },
                  renderLineHighlight: 'none',
                  scrollBeyondLastLine: false,
                }}
              />
            </MonacoDiv>
          </GoAFormItem>

          <GoAFormItem>
            <label>Body</label>
            <MonacoDiv>
              <MonacoEditor
                data-testid="templateForm-body"
                height={200}
                value={body}
                onChange={(value) => setBody(value)}
                language="handlebars"
                options={{
                  tabSize: 2,
                  readOnly: disabled,
                  lineNumbers: 'off',
                  minimap: { enabled: false },
                  overviewRulerBorder: false,
                  lineHeight: 25,
                  renderLineHighlight: 'none',
                }}
              />
            </MonacoDiv>
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton data-testid="template-form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          {disabled ? 'Close' : 'Cancel'}
        </GoAButton>
        {!disabled && (
          <GoAButton
            buttonType="primary"
            data-testid="template-form-save"
            type="submit"
            disabled={!validate()}
            onClick={() => {
              selectedEvent.templates.email.subject = subject;
              selectedEvent.templates.email.body = body;

              const definitionEventIndex = notifications?.events?.findIndex(
                (def) => `${def.namespace}:${def.name}` === `${selectedEvent.namespace}:${selectedEvent.name}`
              );

              notifications.events[definitionEventIndex] = selectedEvent;

              onSubmit(notifications);
            }}
          >
            {getModalState()}
          </GoAButton>
        )}
      </GoAModalActions>
    </GoAModal>
  );
};

const MonacoDiv = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem, 0.15rem;
`;
