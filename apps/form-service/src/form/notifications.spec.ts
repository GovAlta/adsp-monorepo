import { Channel } from '@abgov/adsp-service-sdk';
import { FormMessageNotificationType, FormMessageReviewerNotificationType } from './notifications';
import {
  formMessageForwarded,
  formMessageToApplicant,
  FORM_MESSAGE_FORWARDED,
  FORM_MESSAGE_TO_APPLICANT,
  FORM_MESSAGE_TO_REVIEWER,
} from './events';
import { adspId } from '@abgov/adsp-service-sdk';

describe('form message notification types', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = { id: 'form-1', tenantId: null, definition: { id: 'licence', name: 'Licence' } } as any;

  describe('FormMessageNotificationType', () => {
    // Notification service picks the direct implementation when addressPath is set, and reads the
    // recipient out of the event payload at that path. A mismatch here silently sends nothing.
    it('addresses notifications from a property the events actually set', () => {
      expect(FormMessageNotificationType.addressPath).toBe('recipientEmail');

      expect(formMessageToApplicant(apiId, form, 'applicant@test.co', new Date()).payload).toHaveProperty(
        FormMessageNotificationType.addressPath,
      );
      expect(formMessageForwarded(apiId, form, 'intake@test.co', 'a question', new Date()).payload).toHaveProperty(
        FormMessageNotificationType.addressPath,
      );
    });

    it('has an email template for each of its events', () => {
      expect(FormMessageNotificationType.events.map(({ name }) => name)).toEqual([
        FORM_MESSAGE_TO_APPLICANT,
        FORM_MESSAGE_FORWARDED,
      ]);
      FormMessageNotificationType.events.forEach((event) => expect(event.templates.email).toBeTruthy());
      expect(FormMessageNotificationType.channels).toEqual([Channel.email]);
    });

    // A message can be sent about a draft, not just a submitted form, and drafts and submissions
    // were merged into 'responses'. Calling it a submission in the applicant's email is wrong for
    // every draft conversation, so pin the word.
    it('calls the form a response rather than a submission', () => {
      const toApplicant = FormMessageNotificationType.events.find(({ name }) => name === FORM_MESSAGE_TO_APPLICANT);
      const email = JSON.stringify(toApplicant.templates.email);

      expect(email).toContain('response');
      expect(email).not.toContain('submission');
    });

    it('includes the message only when forwarding to the configured address', () => {
      const toApplicant = FormMessageNotificationType.events.find(({ name }) => name === FORM_MESSAGE_TO_APPLICANT);
      const forwarded = FormMessageNotificationType.events.find(({ name }) => name === FORM_MESSAGE_FORWARDED);

      expect(JSON.stringify(toApplicant.templates.email)).not.toContain('payload.message');
      expect(JSON.stringify(forwarded.templates.email)).toContain('payload.message');
    });
  });

  describe('FormMessageReviewerNotificationType', () => {
    // Reviewers are reached through their own subscription, so this type must stay subscription
    // based; giving it an address path would turn it into a direct type and skip subscribers.
    it('is subscription based', () => {
      expect(FormMessageReviewerNotificationType.addressPath).toBeUndefined();
      expect(FormMessageReviewerNotificationType.events.map(({ name }) => name)).toEqual([FORM_MESSAGE_TO_REVIEWER]);
    });

    it('does not include the message', () => {
      const [event] = FormMessageReviewerNotificationType.events;

      expect(JSON.stringify(event.templates.email)).not.toContain('payload.message');
    });
  });
});
