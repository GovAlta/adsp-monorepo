// Runs the real (unmocked) botbuilder packages so that the patch-package patches in
// patches/bot*+4.23.3.patch, which port botbuilder's zod 3 calls to zod 4, are exercised.
// If a patch stops applying (e.g. after a botbuilder version bump), these fail with a
// zod TypeError rather than the expected behaviour.
import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
} from 'botbuilder';
import { Request, Response } from 'express';

describe('botbuilder zod 4 patches', () => {
  const createAdapter = () => {
    const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
      MicrosoftAppId: 'test-app-id',
      MicrosoftAppPassword: 'test-app-secret',
      MicrosoftAppType: 'SingleTenant',
      MicrosoftAppTenantId: 'test-tenant-id',
    });
    const auth = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);
    return new CloudAdapter(auth);
  };

  const createResponse = () => {
    const res = {
      status: jest.fn(),
      send: jest.fn(),
      end: jest.fn(),
      header: jest.fn(),
    };
    res.status.mockReturnValue(res);
    res.send.mockReturnValue(res);
    res.end.mockReturnValue(res);
    res.header.mockReturnValue(res);
    return res;
  };

  it('can create credential factory, authentication, and adapter from configuration', () => {
    expect(createAdapter()).toBeInstanceOf(CloudAdapter);
  });

  it('can reject a non-object request body with 400', async () => {
    const adapter = createAdapter();
    const res = createResponse();
    const logic = jest.fn();

    await adapter.process(
      { body: 'not an activity', headers: {}, method: 'POST' } as unknown as Request,
      res as unknown as Response,
      logic
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(logic).not.toHaveBeenCalled();
  });

  it('can validate an activity body and reject it as unauthorized', async () => {
    const adapter = createAdapter();
    const res = createResponse();
    const logic = jest.fn();

    await adapter.process(
      {
        body: {
          type: 'message',
          text: 'hello',
          serviceUrl: 'https://smba.trafficmanager.net/teams/',
          channelId: 'msteams',
          conversation: { id: 'conversation-1' },
          from: { id: 'user-1' },
          recipient: { id: 'bot-1' },
        },
        headers: {},
        method: 'POST',
      } as unknown as Request,
      res as unknown as Response,
      logic
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(logic).not.toHaveBeenCalled();
  });
});
