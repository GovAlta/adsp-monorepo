import { readFileSync } from 'fs';
import { join } from 'path';
import { createQuickstartTool } from '../tools/registerQuickstartTool';
import {
  AUDIENCE_MAPPER_STEP,
  BOTH_STEPS_REQUIRED,
  describeKeycloakFix,
  renderQuickstartKeycloakSection,
  SERVICE_ACCOUNT_ROLE_STEP,
} from './keycloakSteps';

const lf = (text: string) => text.replace(/\r\n/g, '\n');
const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ');
const FILE_SERVICE = 'urn:ads:platform:file-service';

describe('get_platform_quickstart', () => {
  it('output matches the golden byte for byte', async () => {
    const [tool] = createQuickstartTool();
    const result = await tool.handler({});
    const golden = readFileSync(join(__dirname, '../fixtures/quickstart.golden.md'), 'utf8');

    expect(lf((result.content[0] as { text: string }).text)).toBe(lf(golden));
  });
});

describe('Keycloak steps', () => {
  it('renders the quickstart Keycloak section from the shared steps', () => {
    const section = renderQuickstartKeycloakSection();

    for (const step of [AUDIENCE_MAPPER_STEP, SERVICE_ACCOUNT_ROLE_STEP]) {
      expect(section).toContain(step.why);
      expect(section).toContain(step.consolePath);
    }
    expect(section).toContain(BOTH_STEPS_REQUIRED);
  });

  it('fills the target URN into both steps', () => {
    const [audience, role] = describeKeycloakFix(FILE_SERVICE);

    expect(audience).toContain(FILE_SERVICE);
    expect(role).toContain(FILE_SERVICE);
  });

  it('uses the example wording when no target is known', () => {
    const [audience, role] = describeKeycloakFix();

    expect(audience).toContain("the target service's URN (for example `urn:ads:platform:file-service`)");
    expect(role).toContain("the target service's URN");
  });

  it.each([[FILE_SERVICE], [undefined]])('always says both steps are required (%s)', (targetUrn) => {
    const fix = describeKeycloakFix(targetUrn);

    expect(fix).toContain(oneLine(BOTH_STEPS_REQUIRED));
    expect(fix.join(' ')).toContain(oneLine(AUDIENCE_MAPPER_STEP.why));
    expect(fix.join(' ')).toContain(oneLine(SERVICE_ACCOUNT_ROLE_STEP.why));
    expect(fix.some((line) => line.includes(AUDIENCE_MAPPER_STEP.title))).toBe(true);
    expect(fix.some((line) => line.includes(SERVICE_ACCOUNT_ROLE_STEP.title))).toBe(true);
  });
});
