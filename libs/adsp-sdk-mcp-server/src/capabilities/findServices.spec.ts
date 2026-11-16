import { join } from 'path';
import { CapabilityCatalog, CatalogService, loadCapabilityCatalog } from './catalog';
import { ServiceFinder, stem, terms } from './findServices';

const CATALOG_PATH = join(__dirname, '..', '..', 'assets', 'capabilities.json');

function service(id: string, use: string, overrides: Partial<CatalogService> = {}): CatalogService {
  return {
    id,
    name: id,
    use,
    doc: `services/${id}.md`,
    specialist: false,
    purpose: null,
    fitQuestions: [],
    dependsOn: [],
    risks: [],
    registrationFields: [],
    patterns: [],
    ...overrides,
  };
}

const SMALL_CATALOG: CapabilityCatalog = {
  sources: [],
  services: [
    service('file-service', 'Upload, scan and download files.', {
      specialist: true,
      purpose: 'Secure file upload and storage.',
      fitQuestions: ['What file types are needed?'],
    }),
    service('pdf-service', 'Generate permit certificates from templates.'),
    service('value-service', 'Store permit certificate values over time.'),
  ],
  patterns: [
    {
      id: 'permit',
      name: 'Permit',
      domainLanguage: ['permit', 'licence'],
      signals: [],
      commonFeatures: [],
      services: ['pdf-service', 'value-service'],
      unsupported: [
        {
          requirement: 'Fee payment',
          reason: 'No ADSP service accepts payments.',
          suggestedApproach: 'Use a payment gateway.',
          keywords: ['fee'],
        },
      ],
    },
  ],
};

describe('terms', () => {
  it('drops stop words and stems the rest', () => {
    expect(terms('Applicants attach the supporting documents')).toEqual(['applicant', 'attach', 'support', 'document']);
  });

  it.each([
    ['certificate', 'certificates'],
    ['update', 'updated'],
    ['attach', 'attached'],
    ['policy', 'policies'],
  ])('stems %s and %s the same', (singular, other) => {
    expect(stem(other)).toBe(stem(singular));
  });

  it('leaves short words alone', () => {
    expect(stem('uses')).toBe('uses');
    expect(stem('file')).toBe('file');
  });
});

describe('ServiceFinder', () => {
  describe('over a small catalog', () => {
    const finder = new ServiceFinder(SMALL_CATALOG);

    it('ranks the service whose own entry matches the need first, as the only strong fit', () => {
      const result = finder.find('upload a file');

      expect(result.matches[0]).toMatchObject({ service: { id: 'file-service' }, fit: 'strong' });
      expect(result.ask).toBe(false);
      expect(result.fitQuestions).toEqual([]);
    });

    it('asks, with each candidate fit question, when two services are strong fits', () => {
      const result = finder.find('permit certificates');

      expect(result.matches.filter(({ fit }) => fit === 'strong').map(({ service: { id } }) => id).sort()).toEqual([
        'pdf-service',
        'value-service',
      ]);
      expect(result.ask).toBe(true);
      expect(result.fitQuestions).toEqual([
        'Is this a need to generate permit certificates from templates (pdf-service)?',
        'Is this a need to store permit certificate values over time (value-service)?',
      ]);
    });

    it('explains a match with the catalog sentence that shares the most terms with the need', () => {
      expect(finder.find('secure storage').matches[0]).toMatchObject({
        service: { id: 'file-service' },
        reason: 'Secure file upload and storage.',
      });
    });

    it('returns a noMatch and no matches when nothing in the catalog fits', () => {
      const result = finder.find('blockchain ledger');

      expect(result).toEqual({
        need: 'blockchain ledger',
        matches: [],
        ask: false,
        fitQuestions: [],
        noMatch: { reason: 'No ADSP service in the catalog covers this need.' },
      });
    });

    it('reports a gap a pattern records, with its suggested approach', () => {
      expect(finder.find('collect a fee').noMatch).toEqual({
        reason: 'No ADSP service accepts payments.',
        knownGap: { requirement: 'Fee payment', reason: 'No ADSP service accepts payments.', suggestedApproach: 'Use a payment gateway.' },
      });
    });

    it('returns the same ranking for the same need', () => {
      expect(finder.find('permit certificates')).toEqual(finder.find('permit certificates'));
    });
  });

  describe('over the bundled catalog', () => {
    const finder = new ServiceFinder(loadCapabilityCatalog(CATALOG_PATH));

    it.each([
      ['applicants attach supporting documents to an application', 'file-service'],
      ['upload file', 'file-service'],
      ['assign review work to a queue of staff', 'task-service'],
    ])('ranks "%s" to %s first, as the only strong fit', (need, expected) => {
      const result = finder.find(need);

      expect(result.matches[0].service.id).toBe(expected);
      expect(result.ask).toBe(false);
    });

    it('asks rather than choosing when the need shares only one word with the best match', () => {
      const result = finder.find('train a machine learning model');

      expect(result.matches.every(({ fit }) => fit !== 'strong')).toBe(true);
      expect(result.ask).toBe(true);
    });

    it('marks payments as a known gap', () => {
      expect(finder.find('accept an application fee').noMatch?.knownGap?.requirement).toBe('Fee or payment processing');
    });

    it('returns no more than five matches', () => {
      expect(finder.find('application status notification form file task calendar').matches.length).toBeLessThanOrEqual(5);
    });
  });
});
