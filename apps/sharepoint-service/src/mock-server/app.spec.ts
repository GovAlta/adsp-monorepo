import * as request from 'supertest';
import { createSharePointMockApp } from './app';
import {
  defaultSeed,
  DEMO_CLIENT_ID,
  DEMO_CLIENT_SECRET,
  DEMO_ENTRA_TENANT_ID,
  DEMO_LIST_ID,
  DEMO_SITE_ID,
  EXPIRED_CLIENT_ID,
  EXPIRED_CLIENT_SECRET,
  UNGRANTED_SITE_ID,
} from './seed';
import { MockState } from './state';

describe('SharePoint mock server', () => {
  let state: MockState;
  let app: ReturnType<typeof createSharePointMockApp>;

  beforeEach(() => {
    state = new MockState(defaultSeed);
    app = createSharePointMockApp(state);
  });

  const requestToken = (clientId = DEMO_CLIENT_ID, secret = DEMO_CLIENT_SECRET) =>
    request(app).post(`/${DEMO_ENTRA_TENANT_ID}/oauth2/v2.0/token`).type('form').send({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: secret,
      scope: 'https://graph.microsoft.com/.default',
    });

  const bearer = async () => `Bearer ${(await requestToken()).body.access_token}`;
  const itemsPath = (siteId = DEMO_SITE_ID, listId = DEMO_LIST_ID) => `/v1.0/sites/${siteId}/lists/${listId}/items`;

  it('issues a token for a valid secret', async () => {
    const res = await requestToken();
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ token_type: 'Bearer', expires_in: 3599 }));
    expect(typeof res.body.access_token).toBe('string');
  });

  it('rejects a wrong secret with AADSTS7000215', async () => {
    const res = await requestToken(DEMO_CLIENT_ID, 'wrong');
    expect(res.status).toBe(401);
    expect(res.body).toEqual(expect.objectContaining({ error: 'invalid_client', error_codes: [7000215] }));
  });

  it('rejects an expired secret with AADSTS7000222', async () => {
    const res = await requestToken(EXPIRED_CLIENT_ID, EXPIRED_CLIENT_SECRET);
    expect(res.status).toBe(401);
    expect(res.body.error_codes).toEqual([7000222]);
  });

  it('rejects Graph calls without a valid token', async () => {
    const res = await request(app).get(`/v1.0/sites/${DEMO_SITE_ID}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('InvalidAuthenticationToken');
  });

  it('denies a site that has no grant for the app', async () => {
    const res = await request(app)
      .get(`/v1.0/sites/${UNGRANTED_SITE_ID}`)
      .set('Authorization', await bearer());
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('accessDenied');
  });

  it('creates items and finds them by the indexed key column', async () => {
    const auth = await bearer();
    const created = await request(app)
      .post(itemsPath())
      .set('Authorization', auth)
      .send({ fields: { AdspItemKey: 'k1', FirstName: 'Ada', Amount: 10 } });
    expect(created.status).toBe(201);

    const found = await request(app)
      .get(itemsPath())
      .set('Authorization', auth)
      .query({ $filter: "fields/AdspItemKey eq 'k1'" });
    expect(found.status).toBe(200);
    expect(found.body.value).toEqual([expect.objectContaining({ id: created.body.id })]);
  });

  it('rejects filtering on an unindexed column', async () => {
    const res = await request(app)
      .get(itemsPath())
      .set('Authorization', await bearer())
      .query({ $filter: "fields/FirstName eq 'Ada'" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("Field 'FirstName'");
  });

  it('rejects an unknown column and names it', async () => {
    const res = await request(app)
      .post(itemsPath())
      .set('Authorization', await bearer())
      .send({ fields: { AdspItemKey: 'k1', Nope: 'x' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ code: 'invalidRequest', message: "Field 'Nope' is not recognized" });
  });

  it('rejects a value of the wrong type', async () => {
    const res = await request(app)
      .post(itemsPath())
      .set('Authorization', await bearer())
      .send({ fields: { AdspItemKey: 'k1', Amount: 'ten' } });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("Field 'Amount'");
  });

  it('updates item fields', async () => {
    const auth = await bearer();
    const created = await request(app)
      .post(itemsPath())
      .set('Authorization', auth)
      .send({ fields: { AdspItemKey: 'k1', FirstName: 'Ada' } });
    const res = await request(app)
      .patch(`${itemsPath()}/${created.body.id}/fields`)
      .set('Authorization', auth)
      .send({ FirstName: 'Grace' });
    expect(res.status).toBe(200);
    expect(state.listItems(DEMO_LIST_ID)[0].fields.FirstName).toBe('Grace');
  });

  it('injects throttling faults and then recovers', async () => {
    const auth = await bearer();
    await request(app).post('/_mock/faults').send({ kind: 'throttle', count: 1 }).expect(200);
    const throttled = await request(app).get(`/v1.0/sites/${DEMO_SITE_ID}`).set('Authorization', auth);
    expect(throttled.status).toBe(429);
    expect(throttled.headers['retry-after']).toBe('2');
    await request(app).get(`/v1.0/sites/${DEMO_SITE_ID}`).set('Authorization', auth).expect(200);
  });

  it('escapes item values in the viewer', async () => {
    await request(app)
      .post(itemsPath())
      .set('Authorization', await bearer())
      .send({ fields: { AdspItemKey: 'k1', FirstName: '<script>alert(1)</script>' } });
    const res = await request(app).get('/_mock');
    expect(res.text).toContain('&lt;script&gt;');
    expect(res.text).not.toContain('<script>alert(1)</script>');
  });
});
