import * as Handlebars from 'handlebars';
import { DateTime } from 'luxon';
import { ClientSecretRotationEvents } from './events';
import { ClientSecretRotationNotificationType } from './notifications';

describe('ClientSecretRotationNotificationType', () => {
  it('has an email template for the due, rotated and revoked events', () => {
    const names = ClientSecretRotationNotificationType.events.map((event) => event.name);

    expect(names).toEqual([
      'client-secret-rotation-due',
      'client-secret-rotated',
      'client-secret-revoked',
      'client-secret-rotation-enabled',
      'client-secret-rotation-disabled',
      'client-secret-rotation-digest',
    ]);
    const defined = ClientSecretRotationEvents.map((event) => event.name);
    names.forEach((name) => expect(defined).toContain(name));
    ClientSecretRotationNotificationType.events
      .filter((event) => event.name !== 'client-secret-rotation-digest')
      .forEach((event) => {
        expect(event.templates.email.subject).toBeTruthy();
        expect(event.templates.email.body).toContain('event.payload.keycloakUrl');
      });
  });

  describe('rendering', () => {
    // The notification service registers the same helper, so the templates can format dates.
    const handlebars = Handlebars.create();
    handlebars.registerHelper('formatDate', (value: string, { hash }: { hash: Record<string, string> }) =>
      DateTime.fromISO(value).setZone('America/Edmonton').toFormat(hash.format),
    );
    const payload: Record<string, unknown> = {
      clientId: 'urn:ads:test:client',
      expiry: '2027-02-24T19:25:29.000Z',
      daysRemaining: 90,
      overlapEndsAt: '2026-12-03T16:08:18.000Z',
      portalUrl: 'https://portal.test',
      keycloakUrl: 'https://kc.test/clients/1/credentials',
    };
    const render = (name: string, data = payload) => {
      const { email } = ClientSecretRotationNotificationType.events.find((event) => event.name === name).templates;
      return {
        subject: handlebars.compile(email.subject)({ event: { payload: data } }),
        body: handlebars.compile(email.body)({ event: { payload: data } }),
      };
    };

    it('formats dates and links the client in Keycloak', () => {
      const timestamp = 'February 24, 2027 \\d{1,2}:25 [ap]\\.?m\\.? M[DS]T';
      const due = render('client-secret-rotation-due');
      expect(due.subject).toMatch(new RegExp(timestamp));
      expect(due.body).toContain('in 90 day(s)');
      expect(due.body).toContain('href="https://kc.test/clients/1/credentials"');

      expect(render('client-secret-rotated').body).toContain('December 3, 2026');
      expect(due.body).toMatch(new RegExp(timestamp));
      expect(render('client-secret-rotated', { ...payload, newExpiry: payload.expiry }).body).toMatch(
        new RegExp(`expires on <b>${timestamp}</b>`),
      );
      expect(due.body).not.toContain('Client secrets page');
    });

    it('lists due and revoked clients in the realm digest', () => {
      const { subject, body } = render('client-secret-rotation-digest', {
        realm: 'tenant-a',
        runbookUrl: 'https://runbook.test',
        due: [
          { clientId: 'client-1', expiry: payload.expiry, daysRemaining: 30, keycloakUrl: 'https://kc.test/1' },
          { clientId: 'client-2', expiry: payload.expiry, daysRemaining: 0 },
        ],
        revoked: [{ clientId: 'client-3', revokedAt: payload.overlapEndsAt }],
      });
      expect(subject).toContain('tenant-a');
      expect(body).toContain('<a href="https://kc.test/1">client-1</a>');
      expect(body).toContain('client-2');
      expect(body).toContain('(in 30 day(s))');
      expect(body).not.toContain('(today)');
      expect(body).not.toMatch(/client-2<\/a>|client-2: expires on <b>[^<]*<\/b> \(in/);
      expect(body).toContain('client-3');
      expect(body).toContain('December 3, 2026');
      expect(body).toContain('href="https://runbook.test"');
    });

    it('omits empty digest sections', () => {
      const { body } = render('client-secret-rotation-digest', { realm: 'tenant-a', due: [], revoked: [] });
      expect(body).not.toContain('Secrets expiring soon');
      expect(body).not.toContain('stopped working');
    });

    it('separates the Keycloak and runbook links', () => {
      const body = render('client-secret-rotated', { ...payload, runbookUrl: 'https://runbook.test' }).body;
      expect(body).toMatch(/Open the client in Keycloak<\/a> \| <a href="https:\/\/runbook.test">Rotation runbook/);
    });

    it('omits the Keycloak link when none is configured', () => {
      expect(render('client-secret-revoked', { ...payload, keycloakUrl: undefined }).body).not.toContain(
        'Open the client in Keycloak',
      );
    });
  });
});
