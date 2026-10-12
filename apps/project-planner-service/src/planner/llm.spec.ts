import axios from 'axios';
import { Logger } from 'winston';
import { ConsultResult } from './analysis';
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
import { SolutionState } from './types';

jest.mock('axios');

const post = jest.fn();
const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };

const config: LlmConfig = {
  baseUrl: 'https://maas.example.gov.ab.ca/v1',
  apiKey: 'test-api-key',
  model: 'GOA-Default',
  timeoutMs: 5000,
  insecureTls: false,
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
  matches: [{ patternId: 'case-management', score: 8, level: 'high', explanation: 'Officers work each application as a case.' }],
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
  artifacts: [],
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
    it('maps a valid response to concepts, matches, hypotheses and questions', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result).toMatchObject({
        model: 'GOA-Default',
        questions: ['Who approves large grants?'],
        matches: [{ patternId: 'case-management', patternName: 'Case Management', score: 8, level: 'high' }],
        hypotheses: [{ title: 'Grant case workflow', patternId: 'case-management', confidence: 'medium' }],
      });
    });

    it('marks mapped concepts as extracted with a generated id', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

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
      post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(post).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({ model: 'GOA-Default', stream: false, messages: expect.any(Array) }),
      );
    });

    it('includes the problem text in the user prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      await buildLlm().analyze('Residents apply for grants.', patterns, []);

      const messages = post.mock.calls[0][1].messages;
      expect(messages[1].content).toContain('Residents apply for grants.');
    });

    it('includes already confirmed concepts in the user prompt', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      await buildLlm().analyze('Residents apply for grants.', patterns, [
        { id: 'c-1', type: 'actor', name: 'Resident', source: 'user' },
      ]);

      expect(post.mock.calls[0][1].messages[1].content).toContain('actor:Resident');
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
      const userPrompt = () => post.mock.calls[0][1].messages[1].content as string;

      it('includes answered questions and answers in the prompt', async () => {
        post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

        await buildLlm().analyze('Residents apply for grants.', patterns, [], context);

        expect(userPrompt()).toContain('Q: Who approves large grants?\nA: The deputy minister');
      });

      it('includes the conversation history in the prompt', async () => {
        post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

        await buildLlm().analyze('Residents apply for grants.', patterns, [], context);

        expect(userPrompt()).toContain('user: We also handle appeals.\nassistant: Noted, appeals are cases too.');
      });

      it('limits the conversation history to the last 12 messages', async () => {
        post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));
        const conversation = Array.from({ length: 14 }, (_v, i) => ({ role: 'user' as const, content: `message-${i}-end` }));

        await buildLlm().analyze('Residents apply for grants.', patterns, [], { answers: [], conversation });

        expect(userPrompt()).not.toContain('message-1-end');
        expect(userPrompt()).toContain('message-2-end');
      });

      it('includes the latest user message in the prompt', async () => {
        post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

        await buildLlm().analyze('Residents apply for grants.', patterns, [], context);

        expect(userPrompt()).toContain('"""Can officers reassign cases?"""');
      });

      it('omits context sections when the context is empty', async () => {
        post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

        await buildLlm().analyze('Residents apply for grants.', patterns, [], { answers: [], conversation: [] });

        expect(userPrompt()).not.toMatch(/already answered these questions|Conversation so far|The user\u0027s latest message/);
      });

      it('omits context sections when no context is provided', async () => {
        post.mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

        await buildLlm().analyze('Residents apply for grants.', patterns, []);

        expect(userPrompt()).not.toMatch(/already answered these questions|Conversation so far|The user\u0027s latest message/);
      });
    });

    describe('reply', () => {
      it('returns the trimmed reply from the model', async () => {
        post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, reply: '  Officers can reassign cases.  ' })));

        const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

        expect(result.reply).toBe('Officers can reassign cases.');
      });

      it.each([
        ['missing', undefined],
        ['not a string', 42],
      ])('returns an empty reply when the reply is %s', async (_name, reply) => {
        post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, reply })));

        const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

        expect(result.reply).toBe('');
      });

      it('truncates a reply longer than 2000 characters', async () => {
        post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, reply: 'a'.repeat(2500) })));

        const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

        expect(result.reply).toHaveLength(2000);
      });
    });

    it('parses JSON returned inside a markdown code fence', async () => {
      post.mockResolvedValueOnce(completion('```json\n' + JSON.stringify(validAnalysis) + '\n```'));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.matches).toHaveLength(1);
    });

    it('requests a corrected response when the first reply is not valid JSON', async () => {
      post
        .mockResolvedValueOnce(completion('Sorry, I cannot do that.'))
        .mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.matches).toHaveLength(1);
    });

    it('sends the invalid reply back to the model when repairing', async () => {
      post
        .mockResolvedValueOnce(completion('Sorry, I cannot do that.'))
        .mockResolvedValueOnce(completion(JSON.stringify(validAnalysis)));

      await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(post.mock.calls[1][1].messages.slice(-2)).toEqual([
        { role: 'assistant', content: 'Sorry, I cannot do that.' },
        { role: 'user', content: expect.stringContaining('not valid JSON') },
      ]);
    });

    it('throws when the repaired reply is also not valid JSON', async () => {
      post.mockResolvedValue(completion('still not json'));

      await expect(buildLlm().analyze('Residents apply for grants.', patterns, [])).rejects.toThrow(
        'Model response did not contain a JSON object.',
      );
    });

    it('only makes one repair attempt for invalid JSON', async () => {
      post.mockResolvedValue(completion('still not json'));

      await buildLlm()
        .analyze('Residents apply for grants.', patterns, [])
        .catch(() => undefined);

      expect(post).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['an empty string', ''],
      ['whitespace', '   '],
      ['a non-string', null],
    ])('throws when the model returns %s as content', async (_name, content) => {
      post.mockResolvedValueOnce(completion(content));

      await expect(buildLlm().analyze('Residents apply for grants.', patterns, [])).rejects.toThrow(
        'Model returned an empty response.',
      );
    });

    it('throws when the response has no choices', async () => {
      post.mockResolvedValueOnce({ data: {} });

      await expect(buildLlm().analyze('Residents apply for grants.', patterns, [])).rejects.toThrow(
        'Model returned an empty response.',
      );
    });

    it('drops matches that reference unknown pattern ids', async () => {
      post.mockResolvedValueOnce(
        completion(
          JSON.stringify({
            ...validAnalysis,
            matches: [{ patternId: 'made-up-pattern', score: 9 }, ...validAnalysis.matches],
          }),
        ),
      );

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.matches.map((m) => m.patternId)).toEqual(['case-management']);
    });

    it('clamps match scores to the 0-10 range', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...validAnalysis, matches: [{ patternId: 'case-management', score: 42 }] })),
      );

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.matches[0].score).toBe(10);
    });

    it('treats a non-numeric match score as zero', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...validAnalysis, matches: [{ patternId: 'case-management', score: 'high' }] })),
      );

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.matches[0].score).toBe(0);
    });

    it('normalizes an invalid confidence level to low', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...validAnalysis, matches: [{ patternId: 'case-management', score: 5, level: 'certain' }] })),
      );

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.matches[0].level).toBe('low');
    });

    it('limits matches to six entries', async () => {
      const matches = patterns.slice(0, 8).map((p) => ({ patternId: p.id, score: 5, level: 'medium' }));
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, matches })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.matches).toHaveLength(6);
    });

    it('normalizes unknown concept types to unknown', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...validAnalysis, concepts: [{ type: 'spaceship', name: 'Grant' }] })),
      );

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.concepts[0].type).toBe('unknown');
    });

    it('drops concepts without a name', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...validAnalysis, concepts: [{ type: 'actor', name: '  ' }, { type: 'actor' }, 'text'] })),
      );

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.concepts).toEqual([]);
    });

    it('omits the description when the model gives none', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ ...validAnalysis, concepts: [{ type: 'actor', name: 'Grant officer' }] })),
      );

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.concepts[0].description).toBeUndefined();
    });

    it('limits concepts to twenty entries', async () => {
      const concepts = Array.from({ length: 25 }, (_v, i) => ({ type: 'actor', name: `Actor ${i}` }));
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, concepts })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.concepts).toHaveLength(20);
    });

    it('drops recommendations for unknown services', async () => {
      const hypothesis = {
        ...validAnalysis.hypotheses[0],
        recommendations: [
          { service: 'teleport-service', reason: 'Not real', order: 1 },
          { service: 'form-service', reason: 'Collect applications', order: 2 },
        ],
      };
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, hypotheses: [hypothesis] })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.hypotheses[0].recommendations.map((r) => r.service)).toEqual(['form-service']);
    });

    it('drops hypotheses that have no valid recommendations', async () => {
      const hypothesis = {
        ...validAnalysis.hypotheses[0],
        recommendations: [{ service: 'teleport-service', reason: 'Not real', order: 1 }],
      };
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, hypotheses: [hypothesis] })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.hypotheses).toEqual([]);
    });

    it('sorts recommendations by their suggested order', async () => {
      const hypothesis = {
        ...validAnalysis.hypotheses[0],
        recommendations: [
          { service: 'form-service', reason: 'Second', order: 2 },
          { service: 'file-service', reason: 'First', order: 1 },
        ],
      };
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, hypotheses: [hypothesis] })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.hypotheses[0].recommendations.map((r) => r.reason)).toEqual(['First', 'Second']);
    });

    it('numbers recommendations by position when the model gives no order', async () => {
      const hypothesis = {
        ...validAnalysis.hypotheses[0],
        recommendations: [{ service: 'form-service', reason: 'Collect applications' }],
      };
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, hypotheses: [hypothesis] })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.hypotheses[0].recommendations[0].order).toBe(1);
    });

    it('clears the pattern id of a hypothesis that references an unknown pattern', async () => {
      const hypothesis = { ...validAnalysis.hypotheses[0], patternId: 'made-up-pattern' };
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, hypotheses: [hypothesis] })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.hypotheses[0].patternId).toBe('');
    });

    it('applies a default title when the hypothesis has none', async () => {
      const hypothesis = { ...validAnalysis.hypotheses[0], title: undefined };
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, hypotheses: [hypothesis] })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.hypotheses[0].title).toBe('Proposed solution');
    });

    it('limits hypotheses to three entries', async () => {
      const hypotheses = Array.from({ length: 5 }, () => validAnalysis.hypotheses[0]);
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, hypotheses })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.hypotheses).toHaveLength(3);
    });

    it('limits questions to six entries', async () => {
      const questions = Array.from({ length: 9 }, (_v, i) => `Question ${i}?`);
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, questions })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.questions).toHaveLength(6);
    });

    it('ignores questions that are not strings', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, questions: [42, '', 'Who approves?'] })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.questions).toEqual(['Who approves?']);
    });

    it('accepts a response that has hypotheses but no usable matches', async () => {
      post.mockResolvedValueOnce(completion(JSON.stringify({ ...validAnalysis, matches: [] })));

      const result = await buildLlm().analyze('Residents apply for grants.', patterns, []);

      expect(result.hypotheses).toHaveLength(1);
    });

    it('throws when there are no usable matches or hypotheses', async () => {
      post.mockResolvedValueOnce(
        completion(JSON.stringify({ concepts: [], matches: [{ patternId: 'made-up-pattern' }], hypotheses: 'none' })),
      );

      await expect(buildLlm().analyze('Residents apply for grants.', patterns, [])).rejects.toThrow(
        'Model response did not contain usable matches or hypotheses.',
      );
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
      post
        .mockResolvedValueOnce(completion('not json'))
        .mockResolvedValueOnce(completion(JSON.stringify(consultJson)));

      const result = await buildLlm().consult(emptyState(), specialist);

      expect(result.advice).toBe(consultJson.advice);
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
        completion(JSON.stringify({ ...discoverJson, factors: [...discoverJson.factors, { id: 'budget', score: 90 }] })),
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
      post.mockResolvedValueOnce(completion(JSON.stringify({ reply: 'Tell me more.', factors: [{ id: 'budget', score: 5 }] })));

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
      ['ask', 'answer the user\'s question about this service.'],
      ['recommend', 'recommend a service-specific solution'],
      ['design', 'help refine the user\'s service-specific design'],
      ['validate', 'validate the user\'s proposed solution'],
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
    const llm = createLlmFromEnv({ MAAS_API_KEY: 'test-api-key', MAAS_MODEL: 'GOA-Large' }, logger as unknown as Logger);

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

  it.each([
    ['true', false],
    ['false', true],
    [undefined, true],
  ])('sets certificate verification for MAAS_INSECURE_TLS=%s', (value, rejectUnauthorized) => {
    createLlmFromEnv({ MAAS_API_KEY: 'test-api-key', MAAS_INSECURE_TLS: value }, logger as unknown as Logger);

    const options = (axios.create as jest.Mock).mock.calls[0][0];
    expect(options.httpsAgent.options.rejectUnauthorized).toBe(rejectUnauthorized);
  });
});
