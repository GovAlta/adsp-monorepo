import React, { FunctionComponent, useState, useEffect } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { EventItem } from '@store/notification/models';
import MonacoEditor from '@monaco-editor/react';
import styled from 'styled-components';

import * as handlebars from 'handlebars/dist/cjs/handlebars';

interface TemplateFormProps {
  onCancel?: () => void;
  onSubmit?: (NotificationItem) => void;
  onClickedOutside?: () => void;
  open: boolean;
  initialValue?: NotificationItem;
  selectedEvent: EventItem;
  notifications: NotificationItem;
  errors?: Record<string, string>;
}

export const TemplateForm: FunctionComponent<TemplateFormProps> = ({
  onCancel,
  onSubmit,
  onClickedOutside,
  notifications,
  open,
  selectedEvent,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const eventTemplateEditHintText = "*GOA default header and footer wrapper is applied if the template doesn't include <!DOCTYPE html> and <html> tags";

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
    try {
      handlebars.parse(body);
      handlebars.parse(subject);
      return true;
    } catch (e) {
      return false;
    }
  };
  const getModalState = () => {
    if (!selectedEvent) {
      return 'Add';
    }
    return selectedEvent?.templates?.email?.body?.length === 0 && selectedEvent?.templates?.email?.subject?.length === 0
      ? 'Add'
      : 'Save';
  };
  const getModalHeadingState = () => {
    if (!selectedEvent) {
      return 'Add';
    }
    return selectedEvent?.templates?.email?.body?.length === 0 && selectedEvent?.templates?.email?.subject?.length === 0
      ? 'Add'
      : 'Edit';
  };
  const getEditEventModalState = () => {
    if (selectedEvent?.templates?.email?.body?.length >= 1 && selectedEvent?.templates?.email?.subject?.length >= 1) {
      return 'Cancel';
    }
    return 'Back';
  };
  return (
    <GoAModal testId="template-form" isOpen={open} onClose={onClickedOutside}>
      <GoAModalTitle>{`${getModalHeadingState()} an email template`}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem>
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
                  scrollbar: { horizontal: 'hidden', vertical: 'hidden' },
                  find: {
                    addExtraSpaceOnTop: false,
                    autoFindInSelection: 'never',
                    seedSearchStringFromSelection: false,
                    overviewRulerBorder: false,
                  },
                  minimap: { enabled: false },
                  renderLineHighlight: 'none',
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                }}
              />
            </MonacoDiv>
          </GoAFormItem>

          <GoAFormItem helpText={eventTemplateEditHintText}>
            <MonacoDiv>
              <MonacoEditor
                data-testid="templateForm-body"
                height={200}
                value={body}
                onChange={(value) => setBody(value)}
                language="handlebars"
                options={{
                  tabSize: 2,
                  lineNumbers: 'off',
                  minimap: { enabled: false },
                  overviewRulerBorder: false,
                  lineHeight: 25,
                  renderLineHighlight: 'none',
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                }}
              />
            </MonacoDiv>
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton data-testid="template-form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          {getEditEventModalState()}
        </GoAButton>
        <GoAButton
          buttonType="primary"
          data-testid="template-form-save"
          type="submit"
          disabled={!validate()}
          onClick={() => {
            const definitionEventIndex = notifications?.events?.findIndex(
              (def) => `${def.namespace}:${def.name}` === `${selectedEvent.namespace}:${selectedEvent.name}`
            );

            notifications.events[definitionEventIndex] = {
              ...selectedEvent,
              templates: {
                email: {
                  subject,
                  body,
                },
              },
            };
            onSubmit(notifications);
          }}
        >
          {getModalState()}
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
