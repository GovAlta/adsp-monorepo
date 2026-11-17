import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { loadCapabilityCatalog } from './catalog';

const LIB_ROOT = join(__dirname, '..', '..');
const WORKSPACE_ROOT = join(LIB_ROOT, '..', '..');
const CAPABILITIES_SCRIPT = join(LIB_ROOT, 'scripts', 'capabilities.mjs');
const catalog = loadCapabilityCatalog(join(LIB_ROOT, 'assets', 'capabilities.json'));

describe('capability catalog', () => {
  // Fails when the planner's specialists or patterns, the service index or the SDK's registration change without
  // regenerating assets/capabilities.json.
  it('matches what its sources generate', () => {
    expect(() =>
      execFileSync(process.execPath, [CAPABILITIES_SCRIPT, '--check'], { cwd: LIB_ROOT, stdio: 'pipe' }),
    ).not.toThrow();
  }, 60_000);

  it('has an entry for every service in the service index, in index order', () => {
    const index = readFileSync(join(WORKSPACE_ROOT, 'docs', 'services', 'services.md'), 'utf8');
    const indexed = [...index.matchAll(/^\|\s*\[[^\]]+\]\(([a-z-]+)\.md\)/gm)].map(([, id]) => id);

    expect(catalog.services.map(({ id }) => id)).toEqual(indexed);
  });

  it('marks services without a planner specialist, and gives them no purpose or fit questions', () => {
    const verify = catalog.services.find(({ id }) => id === 'verify-service');

    expect(verify).toMatchObject({ specialist: false, purpose: null, fitQuestions: [] });
    expect(verify?.use).toBe('Generate and check time-limited verification codes.');
  });

  it("keeps a specialist's purpose, fit questions and dependencies", () => {
    expect(catalog.services.find(({ id }) => id === 'form-service')).toMatchObject({
      specialist: true,
      dependsOn: ['file-service'],
      doc: 'services/form-service.md',
    });
  });

  it.each([
    ['file-service', ['fileTypes']],
    ['notification-service', ['notifications']],
    ['event-service', ['events']],
    ['tenant-service', ['roles']],
    ['configuration-service', ['configurationSchema', 'configuration']],
  ])('reads the ServiceRegistration fields that configure %s from the SDK', (id, fields) => {
    expect(catalog.services.find((service) => service.id === id)?.registrationFields).toEqual(fields);
  });

  it('includes every built-in planner pattern, with the gaps it records', () => {
    expect(catalog.patterns).toHaveLength(19);
    expect(catalog.patterns.flatMap(({ unsupported }) => unsupported.map(({ requirement }) => requirement))).toContain(
      'Fee or payment processing',
    );
  });
});
