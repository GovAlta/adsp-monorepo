import axios from 'axios';
import { Logger } from 'winston';
import { ConsultResult } from './analysis';
import { AcceptanceReference } from './acceptance';
import {
  createLlmFromEnv,
  LlmConfig,
  LlmConsultation,
  MaasLlm,
  mergeConsultation,
  parseJsonObject,
  SpecialistChatMessage,
} from './llm';
import { BUILT_IN_PATTERNS } from './patterns';
import { getSpecialist } from './specialists';
import { SolutionBlueprint, SolutionState, SpecialistNote } from './types';

jest.mock('axios');

const post = jest.fn();
const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };

const config: LlmConfig = {
  baseUrl: 'https://maas.example.gov.ab.ca/v1',
  apiKey: 'test-api-key',
  model: 'GOA-Default',
  timeoutMs: 5000,
};

const completion = (content: unknown) => ({ data: { choices: [{ message: { content } }] } });
const httpError = (status: number) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });
const networkError = (code: string) => Object.assign(new Error(`connect ${code}`), { code });

const validAnalysis = {
  concepts: [
    { type: 'actor', name: 'Grant officer', description: 'Reviews applications' },
    { type: 'document', name: 'Grant application' },
  ],
  matches: [
    { patternId: 'case-management', score: 8, level: 'high', explanation: 'Officers work each application as a case.' },
  ],
  hypotheses: [
    {
      title: 'Grant case workflow',
      patternId: 'case-management',
      confidence: 'medium',
      rationale: 'Applications are reviewed as cases.',
      recommendations: [{ service: 'form-service', reason: 'Collect applications', order: 1 }],
      assumptions: ['Applicants have accounts'],
      unknowns: ['Approval limits'],
    },
  ],
  questions: ['Who approves large grants?'],
};

const emptyState = (): SolutionState => ({
  problemStatement: 'Residents apply for grants.',
  concepts: [],
  decisions: [],
  questions: [],
  patternMatches: [],
  hypotheses: [],
  specialists: [],
  nextSteps: [],
});

describe('parseJsonObject', () => {
  it('parses a plain JSON object', () => {
    const result = parseJsonObject('{"advice":"Use one form"}');

    expect(result).toEqual({ advice: 'Use one form' });
  });

  it('parses JSON wrapped in a markdown code fence', () => {
    const result = parseJsonObject('```json\n{"advice":"Use one form"}\n```');

    expect(result).toEqual({ advice: 'Use one form' });
  });

  it('parses JSON surrounded by commentary', () => {
    const result = parseJsonObject('Here you go: {"advice":"Use one form"} Hope that helps.');

    expect(result).toEqual({ advice: 'Use one form' });
  });

  it.each(['no json here', '', '}{'])('throws when the content "%s" has no JSON object', (content) => {
    expect(() => parseJsonObject(content)).toThrow('Model response did not contain a JSON object.');
  });

  it('throws when the braces contain malformed JSON', () => {
    expect(() => parseJsonObject('{advice: nope}')).toThrow();
  });
});

describe('MaasLlm', () => {
  const patterns = BUILT_IN_PATTERNS;
  let delays: number[];

  const buildLlm = () => new MaasLlm(config, logger as unknown as Logger);

  beforeEach(() => {
    (axios.create as jest.Mock).mockReturnValue({ post });
    delays = [];
    jest.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void, ms: number) => {
      delays.push(ms);
      fn();
      return 0;
    }) as unknown as typeof setTimeout);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe('construction', () => {
    it('creates the http client with the configured base url and timeout', () => {
      buildLlm();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: config.baseUrl, timeout: config.timeoutMs }),
      );
    });

    it('sends the api key as a bearer token', () => {
      buildLlm();

      const options = (axios.create as jest.Mock).mock.calls[0][0];
      expect(options.headers.Authorization).toBe('Bearer test-api-key');
    });

    it('exposes the configured model', () => {
      expect(buildLlm().model).toBe('GOA-Default');
    });
  });

  describe('analyze', () => {
    const problem = 'Residents apply for grants.';
    type AnalyzeArgs = Parameters<MaasLlm['analyze']>;
    const analyze = (concepts: AnalyzeArgs[2] = [], context?: AnalyzeArgs[3]) =>
      buildLlm().analyze(problem, patterns, concepts, context);
    const analyzeWith = (
      overrides: Record<string, unknown> = {},
      concepts?: AnalyzeArgs[2],
      context?: AnalyzeArgs[3],
    ) => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, ...overrides })));
      return analyze(concepts, context);
    };
    const userPrompt = () => post.mock.calls[0][1].messages[1].content as string;

    it('maps a valid response to concepts, matches, hypotheses and questions', async () => {
      const result = await analyzeWith();

      expect(result).toMatchObject({
        model: 'GOA-Default',
        questions: ['Who approves large grants?'],
        matches: [{ patternId: 'case-management', patternName: 'Case Management', score: 8, level: 'high' }],
        hypotheses: [{ title: 'Grant case workflow', patternId: 'case-management', confidence: 'medium' }],
      });
    });

    it('marks mapped concepts as extracted with a generated id', async () => {
      const result = await analyzeWith();

      expect(result.concepts[0]).toEqual({
        id: expect.any(String),
        type: 'actor',
        name: 'Grant officer',
        description: 'Reviews applications',
        source: 'extracted',
        confidence: 0.7,
      });
    });

    it('posts the chat completion request to the completions endpoint', async () => {
      await analyzeWith();

      expect(post).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({ model: 'GOA-Default', stream: false, messages: expect.any(Array) }),
      );
    });

    it('includes the problem text in the user prompt', async () => {
      await analyzeWith();

      expect(userPrompt()).toContain(problem);
    });

    it('includes already confirmed concepts in the user prompt', async () => {
      await analyzeWith({}, [{ id: 'c-1', type: 'actor', name: 'Resident', source: 'user' }]);

      expect(userPrompt()).toContain('actor:Resident');
    });

    describe('conversation context', () => {
      const context = {
        answers: [{ question: 'Who approves large grants?', answer: 'The deputy minister' }],
        conversation: [
          { role: 'user' as const, content: 'We also handle appeals.' },
          { role: 'assistant' as const, content: 'Noted, appeals are cases too.' },
        ],
        message: 'Can officers reassign cases?',
      };
      const contextSections = /already answered these questions|Conversation so far|The user's latest message/;

      it.each([
        ['answered questions and answers', 'Q: Who approves large grants?\nA: The deputy minister'],
        ['the conversation history', 'user: We also handle appeals.\nassistant: Noted, appeals are cases too.'],
        ['the latest user message', '"""Can officers reassign cases?"""'],
      ])('includes %s in the prompt', async (_name, expected) => {
        await analyzeWith({}, [], context);

        expect(userPrompt()).toContain(expected);
      });

      it('limits the conversation history to the last 12 messages', async () => {
        const conversation = Array.from({ length: 14 }, (_v, i) => ({
          role: 'user' as const,
          content: `message-${i}-end`,
        }));

        await analyzeWith({}, [], { answers: [], conversation });

        expect(userPrompt()).not.toContain('message-1-end');
        expect(userPrompt()).toContain('message-2-end');
      });

      it('includes open questions with their ids and asks the model to resolve them', async () => {
        await analyzeWith({}, [], {
          answers: [],
          conversation: [],
          openQuestions: [{ id: 'q-1', question: 'Who approves large grants?' }],
        });

        expect(userPrompt()).toContain('q-1: Who approves large grants?');
        expect(userPrompt()).toContain('resolvedQuestionIds');
      });

      it('omits the open questions section when there are none', async () => {
        await analyzeWith({}, [], { answers: [], conversation: [], openQuestions: [] });

        expect(userPrompt()).not.toContain('still open');
      });

      it('parses resolvedQuestionIds from the response', async () => {
        const result = await analyzeWith({ resolvedQuestionIds: ['q-1', 'q-2'] });

        expect(result.resolvedQuestionIds).toEqual(['q-1', 'q-2']);
      });

      it('defaults resolvedQuestionIds to an empty array when missing', async () => {
        const result = await analyzeWith();

        expect(result.resolvedQuestionIds).toEqual([]);
      });

      it.each([
        ['the context is empty', { answers: [], conversation: [] }],
        ['no context is provided', undefined],
      ])('omits context sections when %s', async (_name, emptyContext) => {
        await analyzeWith({}, [], emptyContext);

        expect(userPrompt()).not.toMatch(contextSections);
      });
    });

    describe('reply', () => {
      it.each([
        ['the trimmed reply', '  Officers can reassign cases.  ', 'Officers can reassign cases.'],
        ['an empty reply when the reply is missing', undefined, ''],
        ['an empty reply when the reply is not a string', 42, ''],
      ])('returns %s', async (_name, reply, expected) => {
        const result = await analyzeWith({ reply });

        expect(result.reply).toBe(expected);
      });

      it('truncates a reply longer than 2000 characters', async () => {
        const result = await analyzeWith({ reply: 'a'.repeat(2500) });

        expect(result.reply).toHaveLength(2000);
      });
    });

    it('parses JSON returned inside a markdown code fence', async () => {
      post.mockResolvedValueOnce(completion('```json\n' + JSON.stringify(validAnalysis) + '\n```'));

      const result = await analyze();

      expect(result.matches).toHaveLength(1);
    });

    it('repairs an invalid JSON reply by sending it back to the model once', async () => {
      post.mockResolvedValueOnce(completion('Sorry, I cannot do that.'));

      const result = await analyzeWith();

      expect(result.matches).toHaveLength(1);
      expect(post.mock.calls[1][1].messages.slice(-2)).toEqual([
        { role: 'assistant', content: 'Sorry, I cannot do that.' },
        { role: 'user', content: expect.stringContaining('not valid JSON') },
      ]);
    });

    it('throws after one repair attempt when the repaired reply is also not valid JSON', async () => {
      post.mockResolvedValue(completion('still not json'));

      await expect(analyze()).rejects.toThrow('Model response did not contain a JSON object.');
      expect(post).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['an empty string', completion('')],
      ['whitespace', completion('   ')],
      ['a non-string', completion(null)],
      ['no choices', { data: {} }],
    ])('throws when the model returns %s', async (_name, response) => {
      post.mockResolvedValueOnce(response);

      await expect(analyze()).rejects.toThrow('Model returned an empty response.');
    });

    it('drops matches that reference unknown pattern ids', async () => {
      const result = await analyzeWith({
        matches: [{ patternId: 'made-up-pattern', score: 9 }, ...validAnalysis.matches],
      });

      expect(result.matches.map((m) => m.patternId)).toEqual(['case-management']);
    });

    it.each([
      ['clamps match scores to the 0-10 range', { score: 42 }, { score: 10 }],
      ['treats a non-numeric match score as zero', { score: 'high' }, { score: 0 }],
      ['normalizes an invalid confidence level to low', { score: 5, level: 'certain' }, { level: 'low' }],
    ])('%s', async (_name, match, expected) => {
      const result = await analyzeWith({ matches: [{ patternId: 'case-management', ...match }] });

      expect(result.matches[0]).toMatchObject(expected);
    });

    it.each<[string, number, Record<string, unknown[]>]>([
      ['matches', 6, { matches: patterns.slice(0, 8).map((p) => ({ patternId: p.id, score: 5, level: 'medium' })) }],
      ['concepts', 20, { concepts: Array.from({ length: 25 }, (_v, i) => ({ type: 'actor', name: `Actor ${i}` })) }],
      ['hypotheses', 3, { hypotheses: Array.from({ length: 5 }, () => validAnalysis.hypotheses[0]) }],
      ['questions', 6, { questions: Array.from({ length: 9 }, (_v, i) => `Question ${i}?`) }],
    ])('limits %s to %i entries', async (field, limit, overrides) => {
      const result = await analyzeWith(overrides);

      expect(result[field as keyof typeof result]).toHaveLength(limit);
    });

    it('normalizes unknown concept types to unknown', async () => {
      const result = await analyzeWith({ concepts: [{ type: 'spaceship', name: 'Grant' }] });

      expect(result.concepts[0].type).toBe('unknown');
    });

    it('drops concepts without a name', async () => {
      const result = await analyzeWith({ concepts: [{ type: 'actor', name: '  ' }, { type: 'actor' }, 'text'] });

      expect(result.concepts).toEqual([]);
    });

    it('omits the description when the model gives none', async () => {
      const result = await analyzeWith({ concepts: [{ type: 'actor', name: 'Grant officer' }] });

      expect(result.concepts[0].description).toBeUndefined();
    });

    describe('hypotheses', () => {
      const analyzeHypothesis = (overrides: Record<string, unknown>) =>
        analyzeWith({ hypotheses: [{ ...validAnalysis.hypotheses[0], ...overrides }] });

      it('drops recommendations for unknown services', async () => {
        const result = await analyzeHypothesis({
          recommendations: [
            { service: 'teleport-service', reason: 'Not real', order: 1 },
            { service: 'form-service', reason: 'Collect applications', order: 2 },
          ],
        });

        expect(result.hypotheses[0].recommendations.map((r) => r.service)).toEqual(['form-service']);
      });

      it('drops hypotheses that have no valid recommendations', async () => {
        const result = await analyzeHypothesis({
          recommendations: [{ service: 'teleport-service', reason: 'Not real', order: 1 }],
        });

        expect(result.hypotheses).toEqual([]);
      });

      it('sorts recommendations by their suggested order', async () => {
        const result = await analyzeHypothesis({
          recommendations: [
            { service: 'form-service', reason: 'Second', order: 2 },
            { service: 'file-service', reason: 'First', order: 1 },
          ],
        });

        expect(result.hypotheses[0].recommendations.map((r) => r.reason)).toEqual(['First', 'Second']);
      });

      it('numbers recommendations by position when the model gives no order', async () => {
        const result = await analyzeHypothesis({
          recommendations: [{ service: 'form-service', reason: 'Collect applications' }],
        });

        expect(result.hypotheses[0].recommendations[0].order).toBe(1);
      });

      it.each([
        [
          'clears the pattern id when it references an unknown pattern',
          { patternId: 'made-up-pattern' },
          'patternId',
          '',
        ],
        ['applies a default title when there is none', { title: undefined }, 'title', 'Proposed solution'],
      ])('%s', async (_name, overrides, field, expected) => {
        const result = await analyzeHypothesis(overrides);

        expect(result.hypotheses[0][field as 'patternId' | 'title']).toBe(expected);
      });
    });

    it('ignores questions that are not strings', async () => {
      const result = await analyzeWith({ questions: [42, '', 'Who approves?'] });

      expect(result.questions).toEqual(['Who approves?']);
    });

    it('accepts a response that has hypotheses but no usable matches', async () => {
      const result = await analyzeWith({ matches: [] });

      expect(result.hypotheses).toHaveLength(1);
    });

    it('throws when there are no usable matches or hypotheses', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ concepts: [], matches: [{ patternId: 'made-up-pattern' }], hypotheses: 'none' })),
      );

      await expect(analyze()).rejects.toThrow('Model response did not contain usable matches or hypotheses.');
    });
  });

  describe('consult', () => {
    const specialist = getSpecialist('form-service');
    const consultJson = {
      advice: 'Start with a single intake form.',
      questions: ['Which fields are mandatory?'],
      risks: ['Duplicate submissions'],
    };

    it('maps a valid response to advice, questions and risks', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      const result = await buildLlm().consult(emptyState(), specialist);

      expect(result).toMatchObject({ ...consultJson, model: 'GOA-Default' });
    });

    it('maps fit, supports, constraints and validation from the response', async () => {
      post.mockResolvedValueOnce(
        completion(
          JSON.stringify({
            ...consultJson,
            fit: 'recommended',
            supports: ['Grant intake'],
            constraints: ['Forms need a published definition'],
            validation: { verdict: 'needs-changes', findings: ['Missing draft retention'] },
          }),
        ),
      );

      const result = await buildLlm().consult(emptyState(), specialist, undefined, 'Use one intake form.');

      expect(result).toMatchObject({
        fit: 'recommended',
        supports: ['Grant intake'],
        constraints: ['Forms need a published definition'],
        validation: { verdict: 'needs-changes', findings: ['Missing draft retention'] },
      });
    });

    it('includes the proposal to validate in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      await buildLlm().consult(emptyState(), specialist, undefined, 'Use one intake form.');

      expect(post.mock.calls[0][1].messages[1].content).toContain('Plan to validate:\n"""Use one intake form."""');
    });

    it('omits the plan section when no proposal is supplied', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      await buildLlm().consult(emptyState(), specialist);

      expect(post.mock.calls[0][1].messages[1].content).not.toContain('Plan to validate');
    });

    it('leaves fit undefined when the fit is not recognised', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...consultJson, fit: 'perfect' })));

      const result = await buildLlm().consult(emptyState(), specialist);

      expect(result.fit).toBeUndefined();
    });

    it('leaves validation undefined when the verdict is not recognised', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...consultJson, validation: { verdict: 'perfect', findings: ['x'] } })),
      );

      const result = await buildLlm().consult(emptyState(), specialist);

      expect(result.validation).toBeUndefined();
    });

    it('defaults supports and constraints to empty lists', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      const result = await buildLlm().consult(emptyState(), specialist);

      expect(result).toMatchObject({ supports: [], constraints: [] });
    });

    it('asks the model to explain the service when no question is supplied', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      await buildLlm().consult(emptyState(), specialist);

      expect(post.mock.calls[0][1].messages[1].content).toContain('Explain how to use this service');
    });

    it('includes the user question in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      await buildLlm().consult(emptyState(), specialist, 'Can applicants save drafts?');

      expect(post.mock.calls[0][1].messages[1].content).toContain('The planner asks: Can applicants save drafts?');
    });

    it('states that the solution is not analyzed when there are no hypotheses', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      await buildLlm().consult(emptyState(), specialist);

      expect(post.mock.calls[0][1].messages[1].content).toContain('not analyzed yet');
    });

    it('includes the first hypothesis and concepts in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));
      const state = emptyState();
      state.hypotheses = [{ ...validAnalysis.hypotheses[0], id: 'h-1', confidence: 'high' } as never];
      state.concepts = [{ id: 'c-1', type: 'actor', name: 'Grant officer', source: 'user' }];

      await buildLlm().consult(state, specialist);

      expect(post.mock.calls[0][1].messages[1].content).toContain('Grant case workflow');
    });

    it('lists the business concepts in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(consultJson)));
      const state = emptyState();
      state.concepts = [{ id: 'c-1', type: 'actor', name: 'Grant officer', source: 'user' }];

      await buildLlm().consult(state, specialist);

      expect(post.mock.calls[0][1].messages[1].content).toContain('actor:Grant officer');
    });

    it('throws when the response is missing advice', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ questions: ['Which fields?'], risks: [] })));

      await expect(buildLlm().consult(emptyState(), specialist)).rejects.toThrow(
        'Model response did not contain advice.',
      );
    });

    it('throws when the advice is blank', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ advice: '   ' })));

      await expect(buildLlm().consult(emptyState(), specialist)).rejects.toThrow(
        'Model response did not contain advice.',
      );
    });

    it('defaults questions and risks to empty lists', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ advice: 'Use one form.' })));

      const result = await buildLlm().consult(emptyState(), specialist);

      expect(result).toMatchObject({ questions: [], risks: [] });
    });

    it('repairs invalid JSON with a second request', async () => {
      post.mockResolvedValueOnce(completion('not json')).mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      const result = await buildLlm().consult(emptyState(), specialist);

      expect(result.advice).toBe(consultJson.advice);
    });
  });

  describe('blueprint', () => {
    const blueprintJson = {
      overview: {
        summary: 'Officers review grant applications as cases.',
        objectives: ['Faster decisions', ' '],
        risks: ['Approval limits'],
      },
      architecture: {
        summary: 'Tenant-scoped services.',
        layers: [
          { name: 'Experience', description: 'Web app', components: ['Officer view'] },
          { name: '', description: 'Nameless layer', components: [] },
          'not a layer',
        ],
        integrations: ['Finance system'],
        security: ['Service roles'],
      },
      services: [
        { service: 'form-service', role: 'Collects applications', capabilities: ['Draft saving'] },
        { service: 'made-up-service', role: 'Unknown', capabilities: [] },
      ],
      components: [
        {
          service: 'form-service',
          type: 'Form definition',
          name: 'Grant application',
          purpose: 'Collects applications',
          dependsOn: ['Grant files'],
          openDecisions: ['Allow drafts?'],
        },
        { service: 'sharepoint-service', name: 'Case library', purpose: 'Stores case files' },
        { service: 'made-up-service', name: 'Unknown', purpose: 'Unknown' },
        { service: 'file-service', name: '', purpose: 'Nameless' },
      ],
      workflows: [
        { name: 'Review', actors: ['Grant officer'], steps: ['Open file in form-service'] },
        { name: 'No steps', actors: [], steps: [] },
      ],
      dataGovernance: { retention: ['7 years'] },
      delivery: {
        phases: [{ name: 'Foundation', items: ['Set up tenant'] }, { name: '' }],
        nonFunctional: ['Accessibility'],
      },
      notCoveredByAdsp: [
        {
          requirement: 'Fee or payment processing',
          reason: 'No ADSP service accepts payments.',
          suggestedApproach: 'Use a payment gateway.',
        },
        { requirement: 'Missing reason', suggestedApproach: 'x' },
        'not an item',
      ],
    };
    const state = (): SolutionState => ({
      ...emptyState(),
      concepts: [{ id: 'c-1', type: 'actor', name: 'Grant officer', source: 'extracted' }],
      discovery: {
        messages: [{ role: 'user', content: 'Officers review grants.', at: '2026-03-01' }],
      } as unknown as SolutionState['discovery'],
      hypotheses: [
        {
          id: 'h-1',
          title: 'Grant case workflow',
          patternId: 'case-management',
          confidence: 'high',
          rationale: 'Applications are reviewed as cases.',
          recommendations: [
            { service: 'file-service', reason: 'Store attachments', order: 2 },
            { service: 'form-service', reason: 'Collect applications', order: 1 },
          ],
          assumptions: [],
          unknowns: [],
        },
      ],
    });
    const note: SpecialistNote = {
      service: 'form-service',
      displayName: 'Form service',
      fit: 'recommended',
      source: 'ai',
      summary: 'Use one intake form.',
      supports: [],
      constraints: ['One form'],
      questions: [],
      risks: ['Duplicate submissions'],
      chatHighlights: [],
      consultedOn: '2026-03-01',
    };
    const userPrompt = () => post.mock.calls[0][1].messages[1].content as string;

    it('returns the model name', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const result = await buildLlm().blueprint(state(), [note]);

      expect(result.model).toBe('GOA-Default');
    });

    it('maps the overview summary and cleans blank list items', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const { core } = await buildLlm().blueprint(state(), [note]);

      expect(core.overview).toMatchObject({
        summary: blueprintJson.overview.summary,
        objectives: ['Faster decisions'],
        risks: ['Approval limits'],
      });
    });

    it('drops layers without a name', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const { core } = await buildLlm().blueprint(state(), [note]);

      expect(core.architecture?.layers).toEqual([
        { name: 'Experience', description: 'Web app', components: ['Officer view'] },
      ]);
    });

    it('keeps named roles and clears a product type that is not a GoA product type', async () => {
      const roles = [
        { actor: 'Grant officer', appRole: 'Reviews applications', productType: 'workspace' },
        { actor: 'Applicant', appRole: 'Applies', productType: 'mobile-app' },
        { actor: '', appRole: 'Nobody', productType: 'workspace' },
      ];
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...blueprintJson, overview: { ...blueprintJson.overview, roles } })));

      const { core } = await buildLlm().blueprint(state(), [note]);

      expect(core.overview?.roles).toEqual([
        { actor: 'Grant officer', appRole: 'Reviews applications', productType: 'workspace' },
        { actor: 'Applicant', appRole: 'Applies', productType: '' },
      ]);
    });

    it('defines both GoA product types in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      await buildLlm().blueprint(state(), [note]);

      const prompt = (post.mock.calls[0][1].messages as { content: string }[]).map((m) => m.content).join('\n');
      expect(prompt).toContain('public-form: For citizen-facing services where users apply for a benefit');
      expect(prompt).toContain('workspace: for productivity-focused services that service delivery staff use as a daily tool');
    });

    it('drops workflows without steps', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const { core } = await buildLlm().blueprint(state(), [note]);

      expect(core.workflows).toEqual([
        { name: 'Review', actors: ['Grant officer'], steps: ['Open file in form-service'] },
      ]);
    });

    it('drops delivery phases without a name', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const { core } = await buildLlm().blueprint(state(), [note]);

      expect(core.delivery?.phases).toEqual([{ name: 'Foundation', items: ['Set up tenant'] }]);
    });

    it('keeps only services that are known specialists', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const { services } = await buildLlm().blueprint(state(), [note]);

      expect(services).toEqual([
        { service: 'form-service', role: 'Collects applications', capabilities: ['Draft saving'] },
      ]);
    });

    it('parses notCoveredByAdsp items and drops ones missing a reason', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const { notCoveredByAdsp } = await buildLlm().blueprint(state(), [note]);

      expect(notCoveredByAdsp).toEqual([
        {
          requirement: 'Fee or payment processing',
          reason: 'No ADSP service accepts payments.',
          suggestedApproach: 'Use a payment gateway.',
        },
      ]);
    });

    it('returns the drafted components for services in the component map', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const { components } = await buildLlm().blueprint(state(), [note]);

      expect(components).toEqual([
        {
          service: 'form-service',
          type: 'Form definition',
          name: 'Grant application',
          purpose: 'Collects applications',
          dependsOn: ['Grant files'],
          openDecisions: ['Allow drafts?'],
        },
      ]);
    });

    it('parses the category on a notCoveredByAdsp item', async () => {
      post.mockResolvedValueOnce(
        completion(
          JSON.stringify({
            ...blueprintJson,
            notCoveredByAdsp: [
              {
                requirement: 'Deposit intake',
                reason: 'No ADSP service accepts payments.',
                suggestedApproach: 'x',
                category: 'payment-collection',
              },
            ],
          }),
        ),
      );

      const { notCoveredByAdsp } = await buildLlm().blueprint(state(), [note]);

      expect(notCoveredByAdsp[0].category).toBe('payment-collection');
    });

    it('truncates a notCoveredByAdsp requirement to a short capability name', async () => {
      post.mockResolvedValueOnce(
        completion(
          JSON.stringify({
            ...blueprintJson,
            notCoveredByAdsp: [
              { requirement: 'a'.repeat(200), reason: 'No ADSP service accepts payments.', suggestedApproach: 'x' },
            ],
          }),
        ),
      );

      const { notCoveredByAdsp } = await buildLlm().blueprint(state(), [note]);

      expect(notCoveredByAdsp[0].requirement).toHaveLength(80);
    });

    it('keeps drafted components for the candidate services', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      const { components } = await buildLlm().blueprint(state(), [note], ['sharepoint-service']);

      expect(components.map((c) => c.service)).toEqual(['form-service', 'sharepoint-service']);
    });

    it('asks for components using the mapped and candidate services', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      await buildLlm().blueprint(state(), [note], ['sharepoint-service']);

      expect(userPrompt()).toMatch(
        /"components": \[[\s\S]*Components may use: [^\n]*form-service[^\n]*sharepoint-service/,
      );
    });

    it('asks the model to keep the service and name of the current ADSP components so their reviews carry over', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));
      const components = [
        { service: 'form-service', name: 'Grant application', target: 'adsp' },
        { service: 'keycloak', name: 'grant-officer', target: 'keycloak' },
      ];

      await buildLlm().blueprint({ ...state(), blueprint: { components } as SolutionState['blueprint'] }, [note]);

      expect(userPrompt()).toMatch(
        /Current components[^\n]*keep the exact service and name[^\n]*:\n- form-service: Grant application/,
      );
      expect(userPrompt()).not.toContain('grant-officer');
    });

    it('leaves the current components out of the prompt for a first blueprint', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      await buildLlm().blueprint(state(), [note]);

      expect(userPrompt()).not.toContain('Current components');
    });

    it('includes the problem, discovery, services in order, concepts and specialist notes in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      await buildLlm().blueprint(state(), [note]);

      expect(userPrompt()).toEqual(
        expect.stringMatching(
          /Residents apply for grants\.[\s\S]*user: Officers review grants\.[\s\S]*1\. form-service: Collect applications\n2\. file-service[\s\S]*actor:Grant officer[\s\S]*- form-service \(recommended\): Use one intake form\. Constraints: One form\. Risks: Duplicate submissions/,
        ),
      );
    });

    it('omits optional prompt sections when the solution has no analysis yet', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(blueprintJson)));

      await buildLlm().blueprint(emptyState(), []);

      expect(userPrompt()).not.toMatch(/Proposed approach|Business concepts|Specialist notes|Discovery conversation/);
    });

    it('accepts a response with only workflows', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ workflows: blueprintJson.workflows })));

      const { core } = await buildLlm().blueprint(emptyState(), []);

      expect(core.workflows).toHaveLength(1);
    });

    it('accepts a response with only layers', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ architecture: blueprintJson.architecture })));

      const { core } = await buildLlm().blueprint(emptyState(), []);

      expect(core.architecture?.layers).toHaveLength(1);
    });

    it.each([
      ['an empty object', {}],
      ['non-object sections', { overview: 'text', architecture: [], workflows: 'none', services: 'none' }],
      ['only a services list', { services: blueprintJson.services }],
    ])('throws when the response is %s', async (_label, json) => {
      post.mockResolvedValueOnce(completion(JSON.stringify(json)));

      await expect(buildLlm().blueprint(emptyState(), [])).rejects.toThrow(
        'Model response did not contain a usable blueprint.',
      );
    });
  });

  describe('acceptanceCriteria', () => {
    const plan = {
      overview: { title: 'Grants', summary: 'Grant intake and review.' },
      workflows: [{ name: 'Apply', actors: ['Applicant'], steps: ['Submit the form'] }],
    } as SolutionBlueprint;
    const references: AcceptanceReference[] = [
      { key: 'workflow:1', label: 'Workflow "Apply"', text: 'Actors: Applicant. Steps: (1) Submit the form' },
      { key: 'decision:d-1', label: 'Decision "Drafts"', text: 'Applicants can save a draft' },
    ];
    const criterion = {
      group: 'Apply',
      actor: 'Applicant',
      given: 'a saved draft',
      when: 'they return',
      then: 'the draft opens',
      source: 'decision:d-1',
    };
    const draftWith = (criteria: unknown) => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ criteria })));
      return buildLlm().acceptanceCriteria(plan, references);
    };
    const userPrompt = () => post.mock.calls[0][1].messages[1].content as string;

    it('maps the response to draft criteria with the model', async () => {
      const result = await draftWith([criterion]);

      expect(result).toEqual({ criteria: [criterion], model: 'GOA-Default' });
    });

    it('lists every plan reference by key with its text', async () => {
      await draftWith([criterion]);

      expect(userPrompt()).toContain('decision:d-1: Applicants can save a draft');
      expect(userPrompt()).toContain('workflow:1: Actors: Applicant. Steps: (1) Submit the form');
    });

    it('offers each workflow and Rules as the groups', async () => {
      await draftWith([criterion]);

      expect(userPrompt()).toContain('Groups: "Apply", "Rules"');
    });

    it('leaves out blank actor, given and when', async () => {
      const { criteria } = await draftWith([{ ...criterion, actor: '', given: ' ', when: undefined }]);

      expect(criteria[0]).toEqual({ group: 'Apply', then: 'the draft opens', source: 'decision:d-1' });
    });

    it('skips criteria with no then or source', async () => {
      const { criteria } = await draftWith([
        { ...criterion, then: '' },
        { ...criterion, source: '' },
        'text',
        criterion,
      ]);

      expect(criteria).toHaveLength(1);
    });

    it('throws when the response has no criteria', async () => {
      await expect(draftWith([])).rejects.toThrow('Model response did not contain acceptance criteria.');
    });
  });

  describe('discover', () => {
    const problem = 'Residents apply for grants and officers review each one.';
    const discoverJson = {
      reply: '1. Who approves grants above the delegated limit?',
      factors: [
        { id: 'problem', score: 60, note: 'Goal is clear' },
        { id: 'users', score: 30, note: '' },
      ],
    };

    it('returns the reply, model and factor scores', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(discoverJson)));

      const result = await buildLlm().discover(problem, [], patterns);

      expect(result).toEqual({
        reply: discoverJson.reply,
        factors: [
          { id: 'problem', score: 60, note: 'Goal is clear' },
          { id: 'users', score: 30, note: undefined },
        ],
        model: 'GOA-Default',
      });
    });

    it('drops factors with ids that are not discovery factors', async () => {
      post.mockResolvedValueOnce(
        completion(
          JSON.stringify({ ...discoverJson, factors: [...discoverJson.factors, { id: 'budget', score: 90 }] }),
        ),
      );

      const result = await buildLlm().discover(problem, [], patterns);

      expect(result.factors.map((f) => f.id)).toEqual(['problem', 'users']);
    });

    it('ignores factor entries that are not objects', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...discoverJson, factors: [null, 'users', ...discoverJson.factors] })),
      );

      const result = await buildLlm().discover(problem, [], patterns);

      expect(result.factors).toHaveLength(2);
    });

    it('treats a non-numeric score as zero', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...discoverJson, factors: [{ id: 'process', score: 'high' }] })),
      );

      const result = await buildLlm().discover(problem, [], patterns);

      expect(result.factors[0].score).toBe(0);
    });

    it('includes the problem in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(discoverJson)));

      await buildLlm().discover(problem, [], patterns);

      expect(post.mock.calls[0][1].messages[1].content).toContain(problem);
    });

    it('states that there is no conversation yet when there are no messages', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(discoverJson)));

      await buildLlm().discover(problem, [], patterns);

      expect(post.mock.calls[0][1].messages[1].content).toContain('No conversation yet.');
    });

    it('includes the conversation so far in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(discoverJson)));

      await buildLlm().discover(problem, [{ role: 'user', content: 'Officers approve within 10 days.' }], patterns);

      expect(post.mock.calls[0][1].messages[1].content).toContain('user: Officers approve within 10 days.');
    });

    it('limits the prompt to the last 16 messages', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(discoverJson)));
      const many = Array.from({ length: 20 }, (_, i) => ({ role: 'user' as const, content: `Answer number ${i}.` }));

      await buildLlm().discover(problem, many, patterns);

      expect(post.mock.calls[0][1].messages[1].content).not.toContain('Answer number 3.');
    });

    it('lists the pattern names in the prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(discoverJson)));

      await buildLlm().discover(problem, [], patterns);

      expect(post.mock.calls[0][1].messages[1].content).toContain(patterns[0].name);
    });

    it('throws when the reply is missing', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ factors: discoverJson.factors })));

      await expect(buildLlm().discover(problem, [], patterns)).rejects.toThrow(
        'Model response did not contain a discovery message and factor scores.',
      );
    });

    it('throws when no valid factors are returned', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ reply: 'Tell me more.', factors: [{ id: 'budget', score: 5 }] })),
      );

      await expect(buildLlm().discover(problem, [], patterns)).rejects.toThrow(
        'Model response did not contain a discovery message and factor scores.',
      );
    });

    it('throws when factors is not an array', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ reply: 'Tell me more.', factors: 'many' })));

      await expect(buildLlm().discover(problem, [], patterns)).rejects.toThrow(
        'Model response did not contain a discovery message and factor scores.',
      );
    });
  });

  describe('converse', () => {
    const specialist = getSpecialist('form-service');
    const messages: SpecialistChatMessage[] = [{ role: 'user', content: 'How do I let applicants save drafts?' }];
    const converseJson = {
      reply: 'Enable draft saving on the form definition.',
      suggestions: ['Set an expiry for drafts'],
      samples: [{ language: 'json', title: 'Form definition', code: '{"supportDrafts":true}' }],
      followUps: ['How long should drafts be kept?'],
    };
    const systemPrompt = () => post.mock.calls[0][1].messages[0].content as string;

    it('maps a valid response to reply, suggestions, samples and follow-ups', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      const result = await buildLlm().converse(specialist, messages, 'ask');

      expect(result).toEqual({ ...converseJson, validation: undefined, model: 'GOA-Default' });
    });

    it('maps a valid validation verdict', async () => {
      const validation = { verdict: 'not-a-fit', findings: ['Use the task service instead'] };
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...converseJson, validation })));

      const result = await buildLlm().converse(specialist, messages, 'validate');

      expect(result.validation).toEqual(validation);
    });

    it('drops a validation with an unrecognised verdict', async () => {
      const validation = { verdict: 'perfect', findings: ['x'] };
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...converseJson, validation })));

      const result = await buildLlm().converse(specialist, messages, 'validate');

      expect(result.validation).toBeUndefined();
    });

    it('limits samples to four', async () => {
      const samples = [1, 2, 3, 4, 5, 6].map((n) => ({ language: 'json', title: `Sample ${n}`, code: `{"n":${n}}` }));
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...converseJson, samples })));

      const result = await buildLlm().converse(specialist, messages, 'sample');

      expect(result.samples.map((s) => s.title)).toEqual(['Sample 1', 'Sample 2', 'Sample 3', 'Sample 4']);
    });

    it('drops samples without code', async () => {
      const samples = [
        { language: 'json', title: 'Empty', code: '   ' },
        { language: 'json', title: 'Missing' },
        null,
        { language: 'json', title: 'Kept', code: '{}' },
      ];
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...converseJson, samples })));

      const result = await buildLlm().converse(specialist, messages, 'sample');

      expect(result.samples).toEqual([{ language: 'json', title: 'Kept', code: '{}' }]);
    });

    it('defaults the sample language to text', async () => {
      const samples = [{ title: 'Snippet', code: 'POST /forms' }];
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...converseJson, samples })));

      const result = await buildLlm().converse(specialist, messages, 'sample');

      expect(result.samples[0].language).toBe('text');
    });

    it('returns no samples when samples is not a list', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...converseJson, samples: 'none' })));

      const result = await buildLlm().converse(specialist, messages, 'ask');

      expect(result.samples).toEqual([]);
    });

    it('defaults suggestions and follow-ups to empty lists', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ reply: 'Use one form.' })));

      const result = await buildLlm().converse(specialist, messages, 'ask');

      expect(result).toMatchObject({ suggestions: [], followUps: [], samples: [] });
    });

    it('limits follow-ups to five', async () => {
      const followUps = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((q) => `Question ${q}?`);
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...converseJson, followUps })));

      const result = await buildLlm().converse(specialist, messages, 'ask');

      expect(result.followUps).toHaveLength(5);
    });

    it.each([
      ['missing', {}],
      ['blank', { reply: '   ' }],
    ])('throws when the reply is %s', async (_name, json) => {
      post.mockResolvedValueOnce(completion(JSON.stringify(json)));

      await expect(buildLlm().converse(specialist, messages, 'ask')).rejects.toThrow(
        'Model response did not contain a reply.',
      );
    });

    it('sends the last twelve messages after the system prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));
      const history: SpecialistChatMessage[] = Array.from({ length: 15 }, (_v, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      await buildLlm().converse(specialist, history, 'ask');

      expect(post.mock.calls[0][1].messages.slice(1).map((m: { content: string }) => m.content)).toEqual(
        history.slice(-12).map((m) => m.content),
      );
    });

    it('truncates long messages to 4000 characters', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      await buildLlm().converse(specialist, [{ role: 'user', content: 'x'.repeat(5000) }], 'ask');

      expect(post.mock.calls[0][1].messages[1].content).toHaveLength(4000);
    });

    it('starts the request with a system message for the specialist', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      await buildLlm().converse(specialist, messages, 'ask');

      expect(post.mock.calls[0][1].messages[0]).toMatchObject({ role: 'system' });
    });

    it.each([
      ['ask', "answer the user's question about this service."],
      ['recommend', 'recommend a service-specific solution'],
      ['design', "help refine the user's service-specific design"],
      ['validate', "validate the user's proposed solution"],
      ['sample', 'provide concise, realistic sample code'],
    ] as const)('includes the %s intent guidance in the system prompt', async (intent, guidance) => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      await buildLlm().converse(specialist, messages, intent);

      expect(systemPrompt()).toContain(`Current task: ${guidance}`);
    });

    it('includes the specialist purpose and dependencies in the system prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      await buildLlm().converse(specialist, messages, 'ask');

      expect(systemPrompt()).toContain(`Service purpose: ${specialist.purpose} Dependencies: file-service.`);
    });

    it('states there are no dependencies or recorded pitfalls when the specialist has none', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      await buildLlm().converse(getSpecialist('value-service'), messages, 'ask');

      expect(systemPrompt()).toContain('Dependencies: none. Known pitfalls: none recorded.');
    });

    it('includes the solution problem statement when state is supplied', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      await buildLlm().converse(specialist, messages, 'design', emptyState());

      expect(systemPrompt()).toContain('Solution context: """Residents apply for grants."""');
    });

    it('omits the solution context when no state is supplied', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      await buildLlm().converse(specialist, messages, 'design');

      expect(systemPrompt()).not.toContain('Solution context');
    });

    it('repairs invalid JSON with a second request', async () => {
      post
        .mockResolvedValueOnce(completion('not json'))
        .mockResolvedValueOnce(completion(JSON.stringify(converseJson)));

      const result = await buildLlm().converse(specialist, messages, 'ask');

      expect(result.reply).toBe(converseJson.reply);
    });
  });

  describe('request retries', () => {
    const analyzeOnce = () => buildLlm().analyze('Residents apply for grants.', patterns, []);

    it('does not retry a 4xx response', async () => {
      post.mockRejectedValue(httpError(400));

      await analyzeOnce().catch(() => undefined);

      expect(post).toHaveBeenCalledTimes(1);
    });

    it('reports the http status when a 4xx response fails', async () => {
      post.mockRejectedValue(httpError(401));

      await expect(analyzeOnce()).rejects.toThrow('Model request failed (HTTP 401)');
    });

    it('retries a 5xx response and succeeds when a later attempt works', async () => {
      post.mockRejectedValueOnce(httpError(503)).mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      const result = await analyzeOnce();

      expect(result.matches).toHaveLength(1);
    });

    it('retries a 429 response', async () => {
      post.mockRejectedValueOnce(httpError(429)).mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      await analyzeOnce();

      expect(post).toHaveBeenCalledTimes(2);
    });

    it.each(['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'])(
      'retries a network error with code %s',
      async (code) => {
        post.mockRejectedValueOnce(networkError(code)).mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

        await analyzeOnce();

        expect(post).toHaveBeenCalledTimes(2);
      },
    );

    it('does not retry an unrecognized error without a response or code', async () => {
      post.mockRejectedValue(new Error('unexpected'));

      await analyzeOnce().catch(() => undefined);

      expect(post).toHaveBeenCalledTimes(1);
    });

    it('does not report an http status for errors without a response', async () => {
      post.mockRejectedValue(new Error('unexpected'));

      await expect(analyzeOnce()).rejects.toThrow('Model request failed: unexpected');
    });

    it('gives up after three retries of a 5xx response', async () => {
      post.mockRejectedValue(httpError(500));

      await analyzeOnce().catch(() => undefined);

      expect(post).toHaveBeenCalledTimes(4);
    });

    it('throws the final error after exhausting retries', async () => {
      post.mockRejectedValue(httpError(502));

      await expect(analyzeOnce()).rejects.toThrow('Model request failed (HTTP 502)');
    });

    it('backs off exponentially between retries', async () => {
      post.mockRejectedValue(httpError(500));

      await analyzeOnce().catch(() => undefined);

      expect(delays).toEqual([1000, 2000, 4000]);
    });

    it('logs a warning for each retry', async () => {
      post.mockRejectedValue(httpError(500));

      await analyzeOnce().catch(() => undefined);

      expect(logger.warn).toHaveBeenCalledTimes(3);
    });

    it('does not retry when the model returns an empty response', async () => {
      post.mockResolvedValue(completion(''));

      await analyzeOnce().catch(() => undefined);

      expect(post).toHaveBeenCalledTimes(1);
    });
  });
});

describe('mergeConsultation', () => {
  const base: ConsultResult = {
    service: 'form-service',
    displayName: 'Form service',
    fit: 'optional',
    advice: 'Rule-based advice.',
    questions: ['Who fills in the form?', 'Which fields are mandatory?'],
    risks: ['Long forms are abandoned'],
  } as unknown as ConsultResult;

  const ai: LlmConsultation = {
    advice: 'AI advice.',
    questions: ['Which fields are mandatory?', 'Can applicants save drafts?'],
    risks: ['Duplicate submissions'],
    fit: 'recommended',
    supports: ['Grant intake'],
    constraints: ['Forms need a published definition'],
    validation: { verdict: 'sound', findings: ['Plan covers drafts'] },
    model: 'GOA-Default',
  };

  it('uses the AI fit over the base fit', () => {
    expect(mergeConsultation(base, ai).fit).toBe('recommended');
  });

  it('keeps the base fit when the AI gives none', () => {
    expect(mergeConsultation(base, { ...ai, fit: undefined }).fit).toBe('optional');
  });

  it('takes supports from the AI consultation', () => {
    expect(mergeConsultation(base, ai).supports).toEqual(['Grant intake']);
  });

  it('takes constraints from the AI consultation', () => {
    expect(mergeConsultation(base, ai).constraints).toEqual(['Forms need a published definition']);
  });

  it('takes validation from the AI consultation', () => {
    expect(mergeConsultation(base, ai).validation).toEqual({ verdict: 'sound', findings: ['Plan covers drafts'] });
  });

  it('replaces the advice with the AI advice', () => {
    expect(mergeConsultation(base, ai).advice).toBe('AI advice.');
  });

  it('combines questions with AI questions first and without duplicates', () => {
    expect(mergeConsultation(base, ai).questions).toEqual([
      'Which fields are mandatory?',
      'Can applicants save drafts?',
      'Who fills in the form?',
    ]);
  });

  it('combines risks with AI risks first', () => {
    expect(mergeConsultation(base, ai).risks).toEqual(['Duplicate submissions', 'Long forms are abandoned']);
  });

  it('preserves the other fields of the base result', () => {
    expect(mergeConsultation(base, ai)).toMatchObject({ service: 'form-service', displayName: 'Form service' });
  });

  it('does not mutate the base result', () => {
    mergeConsultation(base, ai);

    expect(base.advice).toBe('Rule-based advice.');
  });
});

describe('createLlmFromEnv', () => {
  beforeEach(() => {
    (axios.create as jest.Mock).mockReturnValue({ post });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns undefined when MAAS_API_KEY is not set', () => {
    expect(createLlmFromEnv({}, logger as unknown as Logger)).toBeUndefined();
  });

  it('returns undefined when MAAS_API_KEY is empty', () => {
    expect(createLlmFromEnv({ MAAS_API_KEY: '' }, logger as unknown as Logger)).toBeUndefined();
  });

  it('applies the default model when MAAS_MODEL is not set', () => {
    const llm = createLlmFromEnv({ MAAS_API_KEY: 'test-api-key' }, logger as unknown as Logger);

    expect(llm.model).toBe('GOA-Default');
  });

  it('uses the model from MAAS_MODEL', () => {
    const llm = createLlmFromEnv(
      { MAAS_API_KEY: 'test-api-key', MAAS_MODEL: 'GOA-Large' },
      logger as unknown as Logger,
    );

    expect(llm.model).toBe('GOA-Large');
  });

  it('applies the default base url and timeout', () => {
    createLlmFromEnv({ MAAS_API_KEY: 'test-api-key' }, logger as unknown as Logger);

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://maas.int.gov.ab.ca/v1', timeout: 120000 }),
    );
  });

  it('uses the base url and timeout from the environment', () => {
    createLlmFromEnv(
      { MAAS_API_KEY: 'test-api-key', MAAS_BASE_URL: 'https://maas.example.gov.ab.ca/v2', MAAS_TIMEOUT_MS: '30000' },
      logger as unknown as Logger,
    );

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://maas.example.gov.ab.ca/v2', timeout: 30000 }),
    );
  });

  it('falls back to the default timeout when MAAS_TIMEOUT_MS is not numeric', () => {
    createLlmFromEnv({ MAAS_API_KEY: 'test-api-key', MAAS_TIMEOUT_MS: 'soon' }, logger as unknown as Logger);

    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({ timeout: 120000 }));
  });
});
