import { ValueServiceClient } from '../client';
import { createReportCatalog } from './index';

describe('createReportCatalog', () => {
  const client = {} as ValueServiceClient;

  it('registers pdf summary and no other pdf sections', () => {
    const catalog = createReportCatalog(client);

    expect(catalog.pdf.summary).toEqual(expect.any(Function));
    expect(catalog.pdf.trends).toBeUndefined();
    expect(catalog.pdf.topResources).toBeUndefined();
    expect(catalog.form).toBeUndefined();
  });
});
