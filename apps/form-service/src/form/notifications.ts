import { Channel, NotificationType } from '@abgov/adsp-service-sdk';
import { FORM_CREATED, FORM_LOCKED, FORM_SUBMITTED, FORM_UNLOCKED } from './events';

const FORM_EVENT_NAMESPACE = 'form-service';

export const FormStatusNotificationType: NotificationType = {
  name: 'form-status-updates',
  displayName: 'Form status updates',
  description: 'Provides notification of updates to the status of a form.',
  publicSubscribe: false,
  subscriberRoles: [],
  channels: [Channel.email, Channel.sms],
  events: [
    {
      namespace: FORM_EVENT_NAMESPACE,
      name: FORM_CREATED,
      templates: {
        email: {
          subject: '{{ event.payload.form.definition.name }} draft created',
          body: `
<section>
  <p>Your draft {{ event.payload.form.definition.name }} form has been created. We will use this email address to keep you updated.</p>
  <p>Click <a href="{{ event.payload.form.formDraftUrl }}">here</a> to get back to your draft.</p>
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} draft created',
          body:
            'Your draft {{ event.payload.form.definition.name }} form has been created. We will use this email address to keep you ' +
            'updated. Go to {{ event.payload.form.formDraftUrl }} to get back to your draft.',
        },
      },
    },
    {
      namespace: FORM_EVENT_NAMESPACE,
      name: FORM_LOCKED,
      templates: {
        email: {
          subject: '{{ event.payload.form.definition.name }} locked',
          body: `
<section>
  <p>Your draft {{ event.payload.form.definition.name }} form has been locked due to inactivity. It will be deleted on {{ formatDate event.payload.deleteOn }}.</p>
  <p>No action is required if you do not intend to complete the submission. If you do wish to continue, please contact {{ event.payload.definition.supportEmail }} to unlock the draft.</p>
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} locked',
          body:
            'Your draft {{ event.payload.form.definition.name }} form has been locked due to inactivity. It will be deleted on ' +
            '{{ formatDate event.payload.deleteOn }}. No action is required if you do not intend to complete the submission. ' +
            'If you do wish to continue, please contact {{ event.payload.definition.supportEmail }} to unlock the draft.',
        },
      },
    },
    {
      namespace: FORM_EVENT_NAMESPACE,
      name: FORM_UNLOCKED,
      templates: {
        email: {
          subject: '{{ event.payload.form.definition.name }} unlocked',
          body: `
<section>
  <p>Your draft {{ event.payload.form.definition.name }} form has been unlocked.</p>
  <p>Click <a href="{{ event.payload.form.formDraftUrl }}">here</a> to get back to your draft.</p>
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} unlocked',
          body:
            'Your draft {{ event.payload.form.definition.name }} form has been unlocked. Go to {{ event.payload.form.formDraftUrl }} ' +
            'to get back to your draft.',
        },
      },
    },
    {
      namespace: FORM_EVENT_NAMESPACE,
      name: FORM_SUBMITTED,
      templates: {
        email: {
          subject: '{{ event.payload.form.definition.name }} received',
          body: `
<section>
  <p>Your {{ event.payload.form.definition.name }} submission has been received.</p>
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} received',
          body: 'Your {{ event.payload.form.definition.name }} submission has been received.',
        },
      },
    },
  ],
};
