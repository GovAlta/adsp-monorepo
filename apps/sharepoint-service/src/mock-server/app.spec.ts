import * as request from 'supertest';
import { createSharePointMockApp } from './app';
import {
  defaultSeed,
  DEMO_CLIENT_ID,
  DEMO_CLIENT_SECRET,
  DEMO_DETAIL_LIST_ID,
  DEMO_ENTRA_TENANT_ID,
  DEMO_LIBRARY_ID,
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

  it('stores a multi-select answer sent as a collection, without the type marker', async () => {
    const res = await request(app)
      .post(itemsPath())
      .set('Authorization', await bearer())
      .send({
        fields: {
          AdspItemKey: 'k1',
          'ContactMethods@odata.type': 'Collection(Edm.String)',
          ContactMethods: ['Email', 'Phone'],
        },
      });
    expect(res.status).toBe(201);
    expect(state.listItems(DEMO_LIST_ID)[0].fields).toEqual({
      AdspItemKey: 'k1',
      ContactMethods: ['Email', 'Phone'],
    });
  });

  it('rejects multiple values sent without the collection type, like SharePoint', async () => {
    const res = await request(app)
      .post(itemsPath())
      .set('Authorization', await bearer())
      .send({ fields: { AdspItemKey: 'k1', ContactMethods: ['Email'] } });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("Field 'ContactMethods' needs");
  });

  it('rejects a collection type on a column that does not take multiple values', async () => {
    const res = await request(app)
      .post(itemsPath())
      .set('Authorization', await bearer())
      .send({ fields: { AdspItemKey: 'k1', 'FirstName@odata.type': 'Collection(Edm.String)', FirstName: ['Ada'] } });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("Field 'FirstName@odata.type'");
  });

  it('clears a multi-select column with an empty collection', async () => {
    const auth = await bearer();
    const created = await request(app)
      .post(itemsPath())
      .set('Authorization', auth)
      .send({
        fields: { AdspItemKey: 'k1', 'ContactMethods@odata.type': 'Collection(Edm.String)', ContactMethods: ['Email'] },
      });
    const res = await request(app)
      .patch(`${itemsPath()}/${created.body.id}/fields`)
      .set('Authorization', auth)
      .send({ 'ContactMethods@odata.type': 'Collection(Edm.String)', ContactMethods: [] });
    expect(res.status).toBe(200);
    expect(state.listItems(DEMO_LIST_ID)[0].fields).toEqual({ AdspItemKey: 'k1', ContactMethods: [] });
  });

  describe('lists and columns', () => {
    const listsPath = `/v1.0/sites/${DEMO_SITE_ID}/lists`;
    const columnsPath = (listId: string) => `${listsPath}/${listId}/columns`;

    it('creates a list with a required Title column, finds it by name and refuses the same name twice', async () => {
      const auth = await bearer();
      const created = await request(app)
        .post(listsPath)
        .set('Authorization', auth)
        .send({ displayName: "Bo's pets", list: { template: 'genericList' } });
      expect(created.status).toBe(201);

      const found = await request(app)
        .get(listsPath)
        .set('Authorization', auth)
        .query({ $filter: "displayName eq 'Bo''s pets'", $select: 'id,displayName' });
      expect(found.body.value).toEqual([{ id: created.body.id, displayName: "Bo's pets" }]);

      const columns = await request(app).get(columnsPath(created.body.id)).set('Authorization', auth);
      expect(columns.body.value).toEqual([
        expect.objectContaining({ name: 'Title', required: true, indexed: false, text: { allowMultipleLines: false } }),
      ]);

      const duplicate = await request(app)
        .post(listsPath)
        .set('Authorization', auth)
        .send({ displayName: "Bo's pets", list: { template: 'genericList' } });
      expect(duplicate.status).toBe(409);
    });

    it('describes each column with its type facet', async () => {
      const res = await request(app)
        .get(columnsPath(DEMO_LIST_ID))
        .set('Authorization', await bearer());

      expect(res.body.value).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'AdspItemKey', indexed: true, text: { allowMultipleLines: false } }),
          expect.objectContaining({ name: 'Amount', number: {} }),
          expect.objectContaining({ name: 'ContactMethods', choice: { displayAs: 'checkBoxes' } }),
        ]),
      );
    });

    it('creates columns, indexes one and then filters on it', async () => {
      const auth = await bearer();
      const listId = (await request(app).post(listsPath).set('Authorization', auth).send({ displayName: 'Pets' })).body
        .id;

      await request(app)
        .post(columnsPath(listId))
        .set('Authorization', auth)
        .send({ name: 'ParentItemId', displayName: 'ParentItemId', indexed: false, text: {} });
      await request(app)
        .post(columnsPath(listId))
        .set('Authorization', auth)
        .send({
          name: 'Proof',
          displayName: 'Proof',
          indexed: false,
          hyperlinkOrPicture: { isPicture: false },
        });
      const parent = (await request(app).get(columnsPath(listId)).set('Authorization', auth)).body.value.find(
        ({ name }) => name === 'ParentItemId',
      );
      const indexed = await request(app)
        .patch(`${columnsPath(listId)}/${parent.id}`)
        .set('Authorization', auth)
        .send({ indexed: true });
      expect(indexed.status).toBe(200);

      await request(app)
        .post(itemsPath(DEMO_SITE_ID, listId))
        .set('Authorization', auth)
        .send({ fields: { ParentItemId: '7', Proof: { Url: 'https://sp.example/a.pdf', Description: 'a.pdf' } } });
      const found = await request(app)
        .get(itemsPath(DEMO_SITE_ID, listId))
        .set('Authorization', auth)
        .query({ $filter: "fields/ParentItemId eq '7'" });
      expect(found.body.value).toHaveLength(1);
    });

    it('names a new column after the display name it is created with, then lets the display name change', async () => {
      const auth = await bearer();
      const listId = (await request(app).post(listsPath).set('Authorization', auth).send({ displayName: 'People' }))
        .body.id;
      const create = (displayName: string) =>
        request(app)
          .post(columnsPath(listId))
          .set('Authorization', auth)
          .send({ name: 'FirstName', displayName, indexed: false, text: {} });

      const first = await create('First name');
      const second = await create('First name');
      const exact = await create('FirstName');
      const renamed = await request(app)
        .patch(`${columnsPath(listId)}/${exact.body.id}`)
        .set('Authorization', auth)
        .send({ displayName: 'First name' });

      expect([first.body.name, second.body.name, exact.body.name]).toEqual([
        'First_x0020_name',
        'First_x0020_name0',
        'FirstName',
      ]);
      expect(renamed.body).toMatchObject({ name: 'FirstName', displayName: 'First name' });
    });

    it('lists a Hyperlink column without a type facet, like Graph', async () => {
      const auth = await bearer();
      const listId = (await request(app).post(listsPath).set('Authorization', auth).send({ displayName: 'Links' })).body
        .id;
      await request(app)
        .post(columnsPath(listId))
        .set('Authorization', auth)
        .send({ name: 'Proof', displayName: 'Proof', indexed: false, hyperlinkOrPicture: { isPicture: false } });

      const proof = (await request(app).get(columnsPath(listId)).set('Authorization', auth)).body.value.find(
        ({ name }) => name === 'Proof',
      );
      expect(proof).not.toHaveProperty('hyperlinkOrPicture');
    });

    it('rejects text in a Hyperlink column', async () => {
      const auth = await bearer();
      const listId = (await request(app).post(listsPath).set('Authorization', auth).send({ displayName: 'Links' })).body
        .id;
      expect(listId).toEqual(expect.any(String));
      await request(app)
        .post(columnsPath(listId))
        .set('Authorization', auth)
        .send({ name: 'Proof', displayName: 'Proof', indexed: false, hyperlinkOrPicture: { isPicture: false } });

      const res = await request(app)
        .post(itemsPath(DEMO_SITE_ID, listId))
        .set('Authorization', auth)
        .send({ fields: { Proof: 'https://sp.example/a.pdf' } });
      expect(res.status).toBe(400);
    });

    it('refuses list and column changes to an app with only the write role', async () => {
      const writeOnly = new MockState({
        ...defaultSeed,
        sites: defaultSeed.sites.map((site) => ({
          ...site,
          grants: site.grants.map((grant) => ({ ...grant, role: 'write' as const })),
        })),
      });
      const writeApp = createSharePointMockApp(writeOnly);
      const token = (
        await request(writeApp).post(`/${DEMO_ENTRA_TENANT_ID}/oauth2/v2.0/token`).type('form').send({
          grant_type: 'client_credentials',
          client_id: DEMO_CLIENT_ID,
          client_secret: DEMO_CLIENT_SECRET,
        })
      ).body.access_token;

      const list = await request(writeApp)
        .post(listsPath)
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Pets' });
      const column = await request(writeApp)
        .post(columnsPath(DEMO_LIST_ID))
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Extra', displayName: 'Extra', indexed: false, text: {} });
      const read = await request(writeApp).get(columnsPath(DEMO_LIST_ID)).set('Authorization', `Bearer ${token}`);

      expect(list.status).toBe(403);
      expect(column.status).toBe(403);
      expect(read.status).toBe(200);
    });

    it('does not share lists created in one mock with another', async () => {
      const auth = await bearer();
      await request(app).post(listsPath).set('Authorization', auth).send({ displayName: 'Only here' });

      expect(
        new MockState(defaultSeed).findSite(DEMO_SITE_ID).lists.map(({ displayName }) => displayName),
      ).not.toContain('Only here');
    });

    it("answers a list's drive like Graph: the drive for a document library, empty for an ordinary list", async () => {
      const auth = await bearer();
      const driveOf = (listId: string) => request(app).get(`${listsPath}/${listId}/drive`).set('Authorization', auth);

      const library = await driveOf(DEMO_LIBRARY_ID);
      const ordinary = await driveOf(DEMO_LIST_ID);
      const missing = await driveOf('missing');

      expect(library.status).toBe(200);
      expect(library.body).toMatchObject({ id: expect.any(String), driveType: 'documentLibrary' });
      expect(ordinary.status).toBe(200);
      expect(ordinary.body).toEqual({});
      expect(missing.status).toBe(404);
      expect(missing.body.error.code).toBe('itemNotFound');
    });

    it('creates a document library that has a drive', async () => {
      const auth = await bearer();
      const created = await request(app)
        .post(listsPath)
        .set('Authorization', auth)
        .send({ displayName: 'Applicant uploads', list: { template: 'documentLibrary' } });

      const drive = await request(app).get(`${listsPath}/${created.body.id}/drive`).set('Authorization', auth);

      expect(created.status).toBe(201);
      expect(drive.body).toMatchObject({ driveType: 'documentLibrary' });
    });
  });

  describe('detail list', () => {
    const membersPath = () => itemsPath(DEMO_SITE_ID, DEMO_DETAIL_LIST_ID);

    it('finds the detail rows of a main row by the indexed parent column, then deletes them', async () => {
      const auth = await bearer();
      for (const [parent, name] of [
        ['7', 'Bo'],
        ['7', 'Cy'],
        ['8', 'Di'],
      ]) {
        await request(app)
          .post(membersPath())
          .set('Authorization', auth)
          .send({ fields: { ParentItemId: parent, MemberName: name } });
      }

      const found = await request(app)
        .get(membersPath())
        .set('Authorization', auth)
        .query({ $filter: "fields/ParentItemId eq '7'", $select: 'id' });
      expect(found.body.value).toHaveLength(2);

      for (const { id } of found.body.value) {
        const res = await request(app).delete(`${membersPath()}/${id}`).set('Authorization', auth);
        expect(res.status).toBe(204);
      }
      expect(state.listItems(DEMO_DETAIL_LIST_ID).map(({ fields }) => fields.MemberName)).toEqual(['Di']);
    });

    it('returns itemNotFound when deleting a row that is already gone', async () => {
      const res = await request(app)
        .delete(`${membersPath()}/999`)
        .set('Authorization', await bearer());
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('itemNotFound');
    });
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
