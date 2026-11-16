import {
  ACCESS_FULL_INSTRUCTIONS,
  ACCESS_TOOL_GROUPS,
  buildAccessInstructions,
  calledOnlyDisplayTools,
  getAccessActiveTools,
  getLatestUserText,
  getRecentToolNames,
  selectAccessToolGroups,
} from './routing';

const text = (role: string, value: string) => ({
  role,
  content: { format: 2, parts: [{ type: 'text', text: value }] },
});
const toolCall = (toolName: string) => ({
  role: 'assistant',
  content: { format: 2, parts: [{ type: 'tool-invocation', toolInvocation: { toolName, state: 'result' } }] },
});

describe('selectAccessToolGroups', () => {
  it.each([
    ['Is jsmith an admin?', ['people']],
    ['Why can’t jane@example.com sign in?', ['people']],
    ['Show the redirect URIs of my-portal', ['clients']],
    ['Which realms can I inspect?', ['discovery']],
    ['Can Jane use the forms app?', ['clients', 'people']],
    ['Show me what a token from urn:ads:platform:tenant-admin-app would contain', ['clients']],
    ['What roles does urn:ads:platform:form-service define?', ['clients', 'people']],
    ['Check urn:ads:platform:tenant-admin-app', ['clients']],
    ["Users get 'Invalid parameter: redirect_uri' from https://myapp.alberta.ca", ['clients', 'people']],
  ])('picks the groups a question names: %s', (question, groups) => {
    expect(selectAccessToolGroups({ text: question, recentToolNames: [] })).toEqual(groups);
  });

  it('uses the predefined question hint, subtopic first', () => {
    expect(
      selectAccessToolGroups({
        text: 'I want to check something.',
        agentContext: { context: 'common-questions', subtopic: 'app-setup' },
        recentToolNames: [],
      }),
    ).toEqual(['clients']);
    expect(
      selectAccessToolGroups({ text: 'Help me.', agentContext: { context: 'my-users' }, recentToolNames: [] }),
    ).toEqual(['people']);
  });

  it('keeps the tools of the recent conversation for a follow-up that names nothing itself', () => {
    expect(selectAccessToolGroups({ text: 'And for jsmith?', recentToolNames: ['getAccessUserRoles'] })).toEqual([
      'people',
    ]);
  });

  it('uses what the question names rather than the tools used before it', () => {
    expect(
      selectAccessToolGroups({
        text: 'What is the difference between a public and a confidential client?',
        recentToolNames: ['getAccessUserRoles', 'listAccessEnvironments'],
      }),
    ).toEqual(['clients']);
  });

  it('gives small talk only the guide, even after tools were used', () => {
    expect(selectAccessToolGroups({ text: 'hi', recentToolNames: ['getAccessUserRoles'] })).toEqual([]);
  });

  it('gives small talk and documented-only topics just the guide', () => {
    expect(selectAccessToolGroups({ text: 'thanks!', recentToolNames: [] })).toEqual([]);
    expect(
      selectAccessToolGroups({
        text: 'What is the disaster recovery procedure?',
        agentContext: { context: 'infrastructure' },
        recentToolNames: [],
      }),
    ).toEqual([]);
  });

  it('gives an unrecognised question every group rather than risk a missing tool', () => {
    expect(selectAccessToolGroups({ text: 'Check jsmith please', recentToolNames: [] })).toEqual([
      'discovery',
      'clients',
      'people',
    ]);
  });
});

describe('getAccessActiveTools', () => {
  it('always includes the guide', () => {
    expect(getAccessActiveTools([])).toEqual(['getAccessGuide']);
    expect(getAccessActiveTools(['discovery'])).toEqual(['getAccessGuide', ...ACCESS_TOOL_GROUPS.discovery]);
  });
});

describe('buildAccessInstructions', () => {
  it('includes the core rules and only the active groups, then the request context', () => {
    const instructions = buildAccessInstructions(['clients'], { date: '2026-11-10', userName: 'Sam Lee' });

    expect(instructions).toContain('# Access Service assistant');
    expect(instructions).toContain('## Client and app tools');
    expect(instructions).not.toContain('## People and role tools');
    expect(instructions.endsWith('Request context:\nCurrent date: 2026-11-10\nUser: Sam Lee')).toBe(true);
  });

  it('is much smaller for one group than for all of them', () => {
    const one = buildAccessInstructions(['discovery'], { date: '2026-11-10' });

    expect(one.length).toBeLessThan(ACCESS_FULL_INSTRUCTIONS.length * 0.7);
  });
});

describe('message readers', () => {
  it('reads the latest user text', () => {
    expect(getLatestUserText([text('user', 'first'), toolCall('findAccessUser'), text('user', 'second')])).toBe(
      'second',
    );
    expect(getLatestUserText([{ role: 'user', content: 'plain' }])).toBe('plain');
    expect(getLatestUserText([])).toBe('');
  });

  it('reads tool names from the recent messages only', () => {
    const messages = [toolCall('getAccessClient'), ...Array.from({ length: 6 }, () => text('user', 'x'))];

    expect(getRecentToolNames(messages)).toEqual([]);
    expect(getRecentToolNames([toolCall('getAccessUserRoles'), text('user', 'and?')])).toEqual(['getAccessUserRoles']);
  });
});

describe('calledOnlyDisplayTools', () => {
  it('stops after a step that only listed something the card shows', () => {
    expect(calledOnlyDisplayTools({ steps: [{ toolCalls: [{ toolName: 'listAccessEnvironments' }] }] })).toBe(true);
    expect(
      calledOnlyDisplayTools({ steps: [{ toolCalls: [{ payload: { toolName: 'listAccessRoleMembers' } }] }] }),
    ).toBe(true);
  });

  it('continues after tools whose results need an answer, and after text-only steps', () => {
    expect(calledOnlyDisplayTools({ steps: [{ toolCalls: [{ toolName: 'checkAccessUserForService' }] }] })).toBe(false);
    expect(
      calledOnlyDisplayTools({
        steps: [{ toolCalls: [{ toolName: 'listAccessEnvironments' }, { toolName: 'getAccessClient' }] }],
      }),
    ).toBe(false);
    expect(calledOnlyDisplayTools({ steps: [{ toolCalls: [] }] })).toBe(false);
    expect(calledOnlyDisplayTools({ steps: [] })).toBe(false);
  });
});
