import { AjvValidationService } from '@core-services/core-common';
import { applicationNoticePublished } from './events';
import { Logger } from 'winston';
import { NoticeApplicationEntity } from './model/notice';
import { adspId, User } from '@abgov/adsp-service-sdk';
import { NewOrExisting } from '@core-services/core-common';
import { NoticeApplication } from './types';
describe(' application notices published definition', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };

  const testNotice: NewOrExisting<NoticeApplication> = {
    id: '6197eaf24b3a1f0013262c03',
    message: 'Notice for application notice',
    tennantServRef: '[{"id":"6148f920213a6f00121531b45","name":"status"}]',
    startDate: new Date('2021-11-19T17:00:00.000Z'),
    endDate: new Date('2021-11-19T21:00:00.000Z'),
    mode: 'published',
    created: new Date(),
    tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/6195674753ee940013a53b03',
    isAllApplications: false,
    tenantName: 'Test',
  };

  const noticeWithEmptyTenantServRef: NewOrExisting<NoticeApplication> = {
    id: '6197eaf24b3a1f0013262c03',
    message: 'Notice for application notice',
    tennantServRef: '',
    startDate: new Date('2021-11-19T17:00:00.000Z'),
    endDate: new Date('2021-11-19T21:00:00.000Z'),
    mode: 'published',
    created: new Date(),
    tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/6195674753ee940013a53b03',
    isAllApplications: false,
    tenantName: 'Test',
  };

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/6195674753ee940013a53b03`;
  const testUser: User = {
    id: 'user-2',
    name: 'testy',
    email: 'test@testco.org',
    roles: ['test-admin', 'status-admin'],
    tenantId,
    isCore: false,
    token: null,
  };

  const emptyApplication = { description: '', id: '', name: '' };
  it('Validate schema', async () => {
    const validator = new AjvValidationService(logger);
    const testEntity = await NoticeApplicationEntity.create(testUser, repositoryMock, testNotice);
    const testNoticeEntity = await applicationNoticePublished(testEntity, testUser);

    validator.setSchema('application', testNoticeEntity.payload);

    validator.validate('application', 'application', testNoticeEntity);
  });

  it('Check empty tenantServiceRef', async () => {
    const testEntity = await NoticeApplicationEntity.create(testUser, repositoryMock, noticeWithEmptyTenantServRef);
    const testNoticeEntity = await applicationNoticePublished(testEntity, testUser);

    expect(testNoticeEntity.payload.application).toMatchObject(emptyApplication);
  });

  it('No application object when isAllApplications exist', async () => {
    testNotice.isAllApplications = true;
    const testEntity = await NoticeApplicationEntity.create(testUser, repositoryMock, testNotice);
    const testNoticeEntity = await applicationNoticePublished(testEntity, testUser);

    expect(testNoticeEntity.payload.application).toBeUndefined();
  });
});
