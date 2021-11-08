import React, { FunctionComponent, useState } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { EventItem } from '@store/notification/models';
import MonacoEditor from '@monaco-editor/react';
import styled from 'styled-components';

interface TemplateFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
  onSubmit?: (definition: NotificationItem) => void;
  open: boolean;
  selectedEvent: EventItem;
  notifications: NotificationItem;
  errors?: Record<string, string>;
}

export const TemplateForm: FunctionComponent<TemplateFormProps> = ({
  onCancel,
  onSubmit,
  notifications,
  open,
  selectedEvent,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const validate = () => {
    if (!subject || !body) {
      return false;
    }
  };
  const addOrEdit = () => {
    if (!selectedEvent) {
      return 'Add';
    }
    return selectedEvent?.templates?.body?.length === 0 && selectedEvent?.templates?.subject?.length === 0
      ? 'Add'
      : 'Edit';
  };
  return (
    <GoAModal testId="template-form" isOpen={open}>
      <GoAModalTitle>{'Add an email template'}</GoAModalTitle>
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
                value={selectedEvent?.templates?.subject}
                onChange={(value) => setSubject(value)}
                options={{
                  wordWrap: 'off',
                  lineNumbers: 'off',
                  scrollbar: { horizontal: 'hidden', vertical: 'hidden' },
                  find: {
                    addExtraSpaceOnTop: false,
                    autoFindInSelection: 'never',
                    seedSearchStringFromSelection: false,
                  },
                  minimap: { enabled: false },
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
                value={selectedEvent?.templates?.body}
                onChange={(value) => setBody(value)}
                language="handlebars"
                options={{
                  tabSize: 2,
                  lineNumbers: 'off',
                  minimap: { enabled: false },
                }}
              />
            </MonacoDiv>
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton data-testid="template-form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          Cancel
        </GoAButton>
        <GoAButton
          buttonType="primary"
          data-testid="template-form-save"
          type="submit"
          onClick={() => {
            selectedEvent.templates.subject = subject;
            selectedEvent.templates.body = body;
            if (validate()) {
              if (selectedEvent) {
                const definitionEventIndex = notifications?.events?.findIndex(
                  (def) => `${def.namespace}:${def.name}` === `${selectedEvent.namespace}:${selectedEvent.name}`
                );
                if (definitionEventIndex > -1) {
                  notifications.events[definitionEventIndex] = selectedEvent;
                }
              } else {
                notifications.events.push(selectedEvent);
              }
              onSubmit(notifications);
            }
          }}
        >
          {addOrEdit()}
        </GoAButton>
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
