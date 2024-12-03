import { Channel, NotificationType } from '@abgov/adsp-service-sdk';
import { FORM_CREATED, FORM_LOCKED, FORM_SUBMITTED, FORM_UNLOCKED, FORM_SET_TO_DRAFT } from './events';

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
          title: '{{ event.payload.form.definition.name }}',
          subtitle: 'Form draft created',
          body: `
<section>
  <p>We're saving the draft of the <b>{{ event.payload.form.definition.name }}</b> form you started so you can submit it later. Use the following link to go back to the draft when you're ready to continue working on it: <a href="{{ event.payload.form.formDraftUrl }}">{{ event.payload.form.formDraftUrl }}</a></p>
  <p>Future updates on your form draft and submission will also be sent to this inbox.</p>
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} draft created',
          body:
            `We're saving the draft of the {{ event.payload.form.definition.name }} form you started so you can submit it later. ` +
            `Use the following link to go back to the draft when you're ready to continue working on it: {{ event.payload.form.formDraftUrl }}. ` +
            'Future updates on your form draft and submission will also be sent to this number.',
        },
      },
    },
    {
      namespace: FORM_EVENT_NAMESPACE,
      name: FORM_LOCKED,
      templates: {
        email: {
          subject: '{{ event.payload.form.definition.name }} locked',
          title: '{{ event.payload.form.definition.name }}',
          subtitle: 'Form draft locked',
          body: `
<section>
  <p>Your draft <b>{{ event.payload.form.definition.name }}</b> form has been locked due to inactivity. It will be deleted on {{ formatDate event.payload.deleteOn }}.</p>
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
          title: '{{ event.payload.form.definition.name }}',
          subtitle: 'Form draft unlocked',
          body: `
<section>
  <p>Your draft <b>{{ event.payload.form.definition.name }}</b> form has been unlocked.</p>
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
      name: FORM_SET_TO_DRAFT,
      templates: {
        email: {
          subject: '{{ event.payload.form.definition.name }} returned to draft',
          title: '{{ event.payload.form.definition.name }}',
          subtitle: 'Form returned to draft',
          body: `
<section>
  <p>Your <b>{{ event.payload.form.definition.name }}</b> form has been returned to draft.</p>
  <p>Click <a href="{{ event.payload.form.formDraftUrl }}">here</a> to get back to your draft.</p>
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} unlocked',
          body:
            'Your {{ event.payload.form.definition.name }} form has been set to draft, making it editable. Go to {{ event.payload.form.formDraftUrl }} ' +
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
          title: '{{ event.payload.form.definition.name }}',
          subtitle: 'Form submission received',
          body: `
<section>
  <p>We received your <b>{{ event.payload.form.definition.name }}</b> form submission. We appreciate your patience while it is being reviewed.</p>
  <p>Use the following link to see a copy of your submitted form: <a href="{{ event.payload.form.formDraftUrl }}">{{ event.payload.form.formDraftUrl }}</a></p>
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} received',
          body:
            'We received your {{ event.payload.form.definition.name }} form submission. We appreciate your patience while it is being reviewed. ' +
            'Use the following link to see a copy of your submitted form: {{ event.payload.form.formDraftUrl }}',
        },
      },
    },
  ],
};
