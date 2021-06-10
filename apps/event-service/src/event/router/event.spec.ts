import { adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { EventServiceRoles } from '../role';
import { assertUserCanSend } from './event';

describe('event router', () => {
  describe('assertUserCanSend', () => {
    it('can pass for core user', (done) => {
      const next = (err) => {
        expect(err).toBeFalsy();
        done();
      };
      assertUserCanSend(
        { user: { roles: [EventServiceRoles.sender], isCore: true }, body: {} } as Request,
        {} as Response,
        next
      );
    });

    it('can pass for core user sending for tenant', (done) => {
      const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/test';
      const req = {
        user: { roles: [EventServiceRoles.sender], isCore: true },
        body: { tenantId: tenantId },
      } as Request;

      const next = (err) => {
        expect(err).toBeFalsy();
        expect(`${req['tenantId']}`).toBe(tenantId);
        done();
      };
      assertUserCanSend(req, {} as Response, next);
    });

    it('can fail for core user without role.', (done) => {
      const next = (err) => {
        expect(err).toBeTruthy();
        done();
      };
      assertUserCanSend({ user: { roles: [], isCore: true }, body: {} } as Request, {} as Response, next);
    });

    it('can pass for tenant user.', (done) => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const req = {
        user: {
          roles: [EventServiceRoles.sender],
          isCore: false,
          tenantId,
        },
        body: {},
      } as Request;

      const next = (err) => {
        expect(err).toBeFalsy();
        expect(req['tenantId']).toBe(tenantId);
        done();
      };

      assertUserCanSend(req, {} as Response, next);
    });

    it('can fail for tenant user specifying tenantId.', (done) => {
      const next = (err) => {
        expect(err).toBeTruthy();
        done();
      };
      assertUserCanSend(
        {
          user: {
            roles: [EventServiceRoles.sender],
            isCore: false,
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          },
          body: { tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test2' },
        } as Request,
        {} as Response,
        next
      );
    });
  });
});
