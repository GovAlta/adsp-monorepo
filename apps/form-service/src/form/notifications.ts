import { Channel, NotificationType } from '@abgov/adsp-service-sdk';
import {
  FORM_CREATED,
  FORM_LOCKED,
  FORM_MESSAGE_FORWARDED,
  FORM_MESSAGE_TO_APPLICANT,
  FORM_MESSAGE_TO_REVIEWER,
  FORM_SUBMITTED,
  FORM_UNLOCKED,
  FORM_SET_TO_DRAFT,
} from './events';

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
  <p>We're saving the draft of the <b>{{ event.payload.form.definition.name }}</b> form you started so you can submit it later.{{#if event.payload.form.formDraftUrl}} Use the following link to go back to the draft when you're ready to continue working on it: <a href="{{ event.payload.form.formDraftUrl }}">{{ event.payload.form.formDraftUrl }}</a>{{/if}}</p>
  <p>Future updates on your form draft and submission will also be sent to this inbox.</p>
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} draft created',
          body:
            `We're saving the draft of the {{ event.payload.form.definition.name }} form you started so you can submit it later. ` +
            '{{#if event.payload.form.formDraftUrl}}' +
            `Use the following link to go back to the draft when you're ready to continue working on it: {{ event.payload.form.formDraftUrl }}. ` +
            '{{/if}}' +
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
  {{#if event.payload.form.formDraftUrl}}<p>Click <a href="{{ event.payload.form.formDraftUrl }}">here</a> to get back to your draft.</p>{{/if}}
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} unlocked',
          body:
            'Your draft {{ event.payload.form.definition.name }} form has been unlocked.' +
            '{{#if event.payload.form.formDraftUrl}} ' +
            'Go to {{ event.payload.form.formDraftUrl }} to get back to your draft.' +
            '{{/if}}',
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
  {{#if event.payload.form.formDraftUrl}}<p>Click <a href="{{ event.payload.form.formDraftUrl }}">here</a> to get back to your draft.</p>{{/if}}
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} unlocked',
          body:
            'Your {{ event.payload.form.definition.name }} form has been set to draft, making it editable.' +
            '{{#if event.payload.form.formDraftUrl}} ' +
            'Go to {{ event.payload.form.formDraftUrl }} to get back to your draft.' +
            '{{/if}}',
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
  {{#if event.payload.form.formDraftUrl}}<p>Use the following link to see a copy of your submitted form: <a href="{{ event.payload.form.formDraftUrl }}">{{ event.payload.form.formDraftUrl }}</a></p>{{/if}}
</section>`,
        },
        sms: {
          subject: '{{ event.payload.form.definition.name }} received',
          body:
            'We received your {{ event.payload.form.definition.name }} form submission. We appreciate your patience while it is being reviewed. ' +
            '{{#if event.payload.form.formDraftUrl}} ' +
            'Use the following link to see a copy of your submitted form: {{ event.payload.form.formDraftUrl }}' +
            '{{/if}}',
        },
      },
    },
  ],
};

// Messages between an applicant and a reviewer are notified by email so that neither has to sign in
// to find out something is waiting. The address is read off the event rather than from a
// subscription, so no subscriber has to be registered per form.
export const FormMessageNotificationType: NotificationType = {
  name: 'form-message-notifications',
  displayName: 'Form message notifications',
  description: 'Provides notification of messages sent between a form applicant and a reviewer.',
  publicSubscribe: true,
  subscriberRoles: [],
  channels: [Channel.email],
  addressPath: 'recipientEmail',
  events: [
    {
      namespace: FORM_EVENT_NAMESPACE,
      name: FORM_MESSAGE_TO_APPLICANT,
      templates: {
        email: {
          subject: 'New message about your {{ event.payload.form.definition.name }} submission',
          title: '{{ event.payload.form.definition.name }}',
          subtitle: 'You have a new message',
          body: `
<section>
  <p>You have received a message regarding your <b>{{ event.payload.form.definition.name }}</b> submission. Please log in to the form application to read your message and respond.</p>
</section>`,
        },
      },
    },
    {
      namespace: FORM_EVENT_NAMESPACE,
      name: FORM_MESSAGE_FORWARDED,
      templates: {
        email: {
          subject: 'New message from a {{ event.payload.form.definition.name }} applicant',
          title: '{{ event.payload.form.definition.name }}',
          subtitle: 'A message needs a response',
          body: `
<section>
  <p>The following message from a <b>{{ event.payload.form.definition.name }}</b> applicant has been received.</p>
  <blockquote>{{ event.payload.message }}</blockquote>
  <p>Please log in to the form admin application to read the message and respond.</p>
</section>`,
        },
      },
    },
  ],
};

// Reviewers aren't recorded against a form, so they make themselves reachable by subscribing when
// they reply. That subscription is what makes a reviewer "known" for a conversation.
export const FormMessageReviewerNotificationType: NotificationType = {
  name: 'form-message-reviewer-notifications',
  displayName: 'Form message notifications for reviewers',
  description: 'Provides notification to reviewers of messages sent by a form applicant.',
  publicSubscribe: false,
  subscriberRoles: [],
  channels: [Channel.email],
  events: [
    {
      namespace: FORM_EVENT_NAMESPACE,
      name: FORM_MESSAGE_TO_REVIEWER,
      templates: {
        email: {
          subject: 'New message from a {{ event.payload.form.definition.name }} applicant',
          title: '{{ event.payload.form.definition.name }}',
          subtitle: 'You have a new message',
          body: `
<section>
  <p>You have received a message from a <b>{{ event.payload.form.definition.name }}</b> applicant. Please log in to the form admin application to read your message and respond.</p>
</section>`,
        },
      },
    },
  ],
};
