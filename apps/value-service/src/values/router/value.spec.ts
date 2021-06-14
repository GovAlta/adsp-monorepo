import { adspId } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { ServiceUserRoles } from '../types';
import { assertUserCanWrite } from './value';

describe('event router', () => {
  describe('assertUserCanWrite', () => {
    it('can pass for core user', (done) => {
      const next = (err) => {
        expect(err).toBeFalsy();
        done();
      };
      assertUserCanWrite(
        { user: { roles: [ServiceUserRoles.Writer], isCore: true }, body: {} } as Request,
        {} as Response,
        next
      );
    });

    it('can pass for core user sending for tenant', (done) => {
      const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/test';
      const req = {
        user: { roles: [ServiceUserRoles.Writer], isCore: true },
        body: { tenantId: tenantId },
      } as Request;

      const next = (err) => {
        expect(err).toBeFalsy();
        expect(`${req['tenantId']}`).toBe(tenantId);
        done();
      };
      assertUserCanWrite(req, {} as Response, next);
    });

    it('can fail for core user without role.', (done) => {
      const next = (error) => {
        try {
          expect(error).toBeTruthy();
          done();
        } catch (err) {
          done(err);
        }
      };
      assertUserCanWrite({ user: { roles: [], isCore: true }, body: {} } as Request, {} as Response, next);
    });

    it('can pass for tenant user.', (done) => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const req = {
        user: {
          roles: [ServiceUserRoles.Writer],
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

      assertUserCanWrite(req, {} as Response, next);
    });

    it('can fail for tenant user specifying tenantId.', (done) => {
      const next = (error) => {
        try {
          expect(error).toBeTruthy();
          done();
        } catch (err) {
          done(err);
        }
      };
      assertUserCanWrite(
        {
          user: {
            roles: [ServiceUserRoles.Writer],
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
