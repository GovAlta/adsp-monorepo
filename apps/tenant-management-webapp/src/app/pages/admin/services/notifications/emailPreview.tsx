import React, { FunctionComponent, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { EventItem } from '@store/notification/models';
import { getHeaderPreview, getFooterPreview } from '@shared/events/';

import DOMPurify from 'dompurify';
import * as handlebars from 'handlebars/dist/cjs/handlebars';

interface PreviewProps {
  onCancel?: () => void;
  open: boolean;
  initialValue?: NotificationItem;
  selectedEvent: EventItem;
  notifications: NotificationItem;
  errors?: Record<string, string>;
}

const simplePayload = {
  event: {
    payload: {
      application: {
        id: '6196e231430bc60012299389',
        url: 'https://status-app-core-services-dev.os99.gov.ab.ca/athenatest',
        name: 'Status',
        description: '',
      },
    },
  },
};

export const EmailPreview: FunctionComponent<PreviewProps> = ({ onCancel, open, selectedEvent }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  console.log('selectedEvent', selectedEvent);
  useEffect(() => {
    if (selectedEvent) {
      setSubject(selectedEvent?.templates?.email?.subject);
      setBody(selectedEvent?.templates?.email?.body);
    }
  }, [selectedEvent, open]);

  const dynamicGeneratePayload = () => {};
  const serviceName = `${selectedEvent?.namespace}:${selectedEvent?.name}`;
  return (
    <GoAModal testId="email-preview" isOpen={open}>
      <GoAModalTitle>{`Preview an email template---${serviceName}`}</GoAModalTitle>
      <GoAModalContent>
        {/* header  */}
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getHeaderPreview()) }}></div>
        <GoAForm>
          <hr />
          <GoAFormItem>
            <h2>
              <div
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(handlebars.compile(subject)(simplePayload)) }}
              ></div>
            </h2>
          </GoAFormItem>
          <hr />
          <GoAFormItem>
            <div
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(handlebars.compile(body)(simplePayload)) }}
            ></div>
          </GoAFormItem>
        </GoAForm>
        {/* footer  */}
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getFooterPreview(serviceName)) }}></div>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton data-testid="preview-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          Close
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
