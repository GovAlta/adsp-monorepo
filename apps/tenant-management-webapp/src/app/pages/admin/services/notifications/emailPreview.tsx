import React, { FunctionComponent, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { EventItem } from '@store/notification/models';
import { getTemplateBody } from '@core-services/notification-shared';

import { sanitizeHtml } from './utils';
import styled from 'styled-components';
import { generateMessage } from '@lib/handlebarHelper';
import { RootState } from '@store/index';
import { dynamicGeneratePayload } from '@lib/dynamicPlaceHolder';
import { subscriberAppUrlSelector } from './selectors';
interface PreviewProps {
  onCancel?: () => void;
  open: boolean;
  initialValue?: NotificationItem;
  selectedEvent: EventItem;
  notifications: NotificationItem;
}

export const EmailPreview: FunctionComponent<PreviewProps> = ({ onCancel, open, selectedEvent }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  useEffect(() => {
    if (selectedEvent) {
      setSubject(selectedEvent?.templates?.email?.subject);
      setBody(selectedEvent?.templates?.email?.body);
    }
  }, [selectedEvent, open]);
  const tenant = useSelector((state: RootState) => ({ name: state.tenant?.name, realm: state.session.realm }));
  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);
  const eventDef = eventDefinitions[`${selectedEvent?.namespace}:${selectedEvent?.name}`];

  const subscriberAppUrl = useSelector(subscriberAppUrlSelector);
  const htmlPayload = dynamicGeneratePayload(tenant, eventDef, subscriberAppUrl);
  const serviceName = `${selectedEvent?.namespace}:${selectedEvent?.name}`;

  return (
    <GoAModal testId="email-preview" isOpen={open}>
      <GoAModalTitle>{`Preview an email template---${serviceName}`}</GoAModalTitle>
      <GoAModalContent>
        <EventContentWrapper>
          <GoAForm>
            <GoAFormItem>
              <h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(generateMessage(subject, htmlPayload)),
                  }}
                ></div>
              </h3>
            </GoAFormItem>
            <hr />
            <GoAFormItem>
              <div>
                <p
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(generateMessage(getTemplateBody(body), htmlPayload)),
                  }}
                />
              </div>
            </GoAFormItem>
          </GoAForm>
          <hr />
        </EventContentWrapper>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton data-testid="preview-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          Close
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
const EventContentWrapper = styled.div`
  margin-top: 2rem;
  padding-left: 4.5rem;
  padding-right: 4.5rem;
`;
