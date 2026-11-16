import {
  ACCESS_GUIDE_TOPIC_IDS,
  describeAccessGuideTopics,
  extractMarkdownSection,
  getAccessGuideSection,
  isAccessGuideTopic,
} from './guide';

describe('Access Service guide', () => {
  it.each(ACCESS_GUIDE_TOPIC_IDS)('serves the documented section for %s', (topic) => {
    const section = getAccessGuideSection(topic);

    expect(section.topic).toBe(topic);
    expect(section.title).toBeTruthy();
    expect(section.markdown).toMatch(/^#{2,3} /);
    expect(section.markdown).not.toMatch(/You are the|specialist/i);
  });

  it('serves documented facts used by predefined questions', () => {
    expect(getAccessGuideSection('environments').markdown).toContain('https://access.adsp-dev.gov.ab.ca');
    expect(getAccessGuideSection('saml-certificates').markdown).toContain('18-month expiry');
    expect(getAccessGuideSection('goa-ad').markdown).toContain('internal government staff');
    expect(getAccessGuideSection('uiam-integration').markdown).toContain('SAML v2.0');
  });

  // The tenant admin app shows these topics to people as answers, without a model in between.
  it.each([
    'environments',
    'responsibility',
    'public-client',
    'confidential-client',
    'token-claims',
    'token-expiry',
    'token-audience',
    'idp-claim-to-token',
    'goa-ad',
    'uiam-integration',
    'saml-certificates',
    'architecture',
    'disaster-recovery',
  ] as const)('reads as an answer for a person: %s', (topic) => {
    expect(getAccessGuideSection(topic).markdown).not.toMatch(
      /verbatim|architect agent|this agent|when asked|do not invent|direct the user|do not add extra steps/i,
    );
  });

  it('recognises only known topics', () => {
    expect(isAccessGuideTopic('token-expiry')).toBe(true);
    expect(isAccessGuideTopic('toString')).toBe(false);
    expect(isAccessGuideTopic(undefined)).toBe(false);
  });

  it('describes every topic for the tool', () => {
    for (const topic of ACCESS_GUIDE_TOPIC_IDS) {
      expect(describeAccessGuideTopics()).toContain(`${topic}: `);
    }
  });
});

describe('extractMarkdownSection', () => {
  const markdown = ['# Title', 'intro', '## A', 'a text', '### A.1', 'a1 text', '## B', 'b text'].join('\n');

  it('includes subsections and stops at the next heading of the same level', () => {
    expect(extractMarkdownSection(markdown, '## A')).toBe('## A\na text\n### A.1\na1 text');
  });

  it('stops a subsection at its parent level', () => {
    expect(extractMarkdownSection(markdown, '### A.1')).toBe('### A.1\na1 text');
  });

  it('runs to the end for the last section', () => {
    expect(extractMarkdownSection(markdown, '## B')).toBe('## B\nb text');
  });

  it('fails for a missing heading', () => {
    expect(() => extractMarkdownSection(markdown, '## Missing')).toThrow('heading not found');
  });
});
