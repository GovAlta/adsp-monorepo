import { AuditService, EventService } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import * as multer from 'multer';
import { Logger } from 'winston';
import {
  getSolution,
  getTenantId,
  isPlannerAdmin,
  loaded,
  loadSolution,
  requirePlannerAdmin,
  requirePlannerUser,
  requireSolutionOwner,
} from './access';
import { acceptanceReferences, checkedAcceptanceCriteria, ruleAcceptanceCriteria } from './acceptance';
import {
  AdminAccessOperation,
  AnalyzedAuditMetadata,
  AnalyzedEndpoint,
  auditAdminAccess,
  createAuditRecorder,
  PatternCreatedAuditAction,
  PatternDeletedAuditAction,
  PatternUpdatedAuditAction,
  SolutionAdminAccessedAuditAction,
  SolutionAnalyzedAuditAction,
  SolutionCreatedAuditAction,
  SolutionDeletedAuditAction,
  SpecialistChatDeletedAuditAction,
  SpecialistChatExportedAuditAction,
  toPatternAuditDetails,
  toPatternChangeSet,
  toSolutionAuditDetails,
  toSpecialistChatAuditDetails,
  toAuditStatus,
} from './audit';
import {
  buildHypotheses,
  buildNextSteps,
  ConsultResult,
  consultSpecialist,
  extractConcepts,
  matchPatterns,
} from './analysis';
import {
  assembleBlueprint,
  BlueprintServiceDetail,
  buildRuleBlueprint,
  chatHighlights,
  mergeBlueprintCore,
  recommendedServices,
  storedConsult,
  toSpecialistNote,
} from './blueprint';
import { buildComponents, catalogServices, driftMessage, unmappedServices } from './components';
import {
  extractProblemStatementText,
  isSupportedProblemStatementFile,
  MAX_PROBLEM_STATEMENT_UPLOAD_BYTES,
} from './documentExtract';
import {
  allUserEvidence,
  applyAnswerToFactors,
  areSimilarQuestions,
  assessConfidence,
  capFactors,
  computeConfidence,
  dedupeOpenQuestions,
  DISCOVERY_THRESHOLD,
  isDiscoveryReady,
  isQuestionCovered,
  normalizeFactors,
  ruleAssess,
  ruleDiscoveryReply,
  userEvidence,
} from './discovery';
import { solutionCreated, solutionDeleted, solutionUpdated } from './events';
import { mergeConsultation, PlannerLlm, SpecialistChatMessage, SpecialistIntent, SpecialistReply } from './llm';
import { BUILT_IN_PATTERNS } from './patterns';
import {
  PatternRepository,
  SolutionRepository,
  SolutionVersionRepository,
  SpecialistChatRepository,
} from './repository';
import { getSpecialist, ruleBasedSpecialistReply, SPECIALISTS } from './specialists';
import {
  AnalysisMode,
  BlueprintAcceptance,
  BusinessConcept,
  BlueprintComponent,
  BusinessPattern,
  CONCEPT_TYPES,
  ComponentReview,
  Hypothesis,
  PatternMatch,
  PlannerConfiguration,
  Solution,
  SolutionBlueprint,
  SolutionState,
  SpecialistChat,
  SpecialistNote,
  SpecialistStatus,
  StoredChatMessage,
} from './types';
import { contentHash, versionContent } from './versioning';
import { createVersionRouter } from './versionRouter';

interface PlannerRouterProps {
  logger: Logger;
  solutionRepository: SolutionRepository;
  patternRepository: PatternRepository;
  specialistChatRepository: SpecialistChatRepository;
  solutionVersionRepository: SolutionVersionRepository;
  eventService: EventService;
  auditService: AuditService;
  // When provided, AI analysis is available and is the default mode.
  llm?: PlannerLlm;
  // Reads the keys of the live ADSP configuration catalog, used to find services missing from the component map.
  readAdspCatalog?: () => Promise<string[]>;
}

const MAX_CHAT_MESSAGES = 200;
const SPECIALIST_INTENTS: SpecialistIntent[] = ['ask', 'recommend', 'design', 'validate', 'sample'];
const SOLUTION_STATUSES = ['draft', 'analyzed', 'in-progress', 'completed', 'archived'];

const emptyState = (problemStatement = ''): SolutionState => ({
  problemStatement,
  concepts: [],
  decisions: [],
  questions: [],
  patternMatches: [],
  hypotheses: [],
  specialists: [],
  nextSteps: [],
});

const BUILT_IN_IDS = new Set(BUILT_IN_PATTERNS.map((p) => p.id));

// Effective catalogue: built-in patterns, overridden by configuration, overridden by stored tenant patterns.
async function getPatterns(req: Request, patternRepository: PatternRepository): Promise<BusinessPattern[]> {
  const [config] = await req.getConfiguration<PlannerConfiguration>();
  const overrides = config?.patterns || {};
  const stored = await patternRepository.find(getTenantId(req));
  const merged = new Map<string, BusinessPattern>(BUILT_IN_PATTERNS.map((p) => [p.id, { ...p, source: 'built-in' }]));
  const withDefaults = (p: BusinessPattern): BusinessPattern => ({
    commonFeatures: [],
    weakSignals: [],
    clarifyingQuestions: [],
    assumptions: [],
    knownUnknowns: [],
    description: '',
    ...p,
    source: BUILT_IN_IDS.has(p.id) ? 'customized' : 'custom',
  });
  Object.values(overrides).forEach((p) => merged.set(p.id, withDefaults(p)));
  stored.forEach((p) => merged.set(p.id, withDefaults(p)));
  return [...merged.values()];
}

const PATTERN_ID = /^[a-z0-9][a-z0-9-]{1,59}$/;
const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

const text = (value: unknown, max = 2000): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const texts = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).map((v) => text(v, 500)).filter(Boolean);
const signals = (value: unknown): { description: string; keywords: string[] }[] =>
  (Array.isArray(value) ? value : [])
    .map((s) => ({ description: text(s?.description, 500), keywords: texts(s?.keywords) }))
    .filter((s) => s.description && s.keywords.length > 0);

// Builds a pattern from request input, keeping only known fields.
const toPattern = (id: string, input: Record<string, unknown>): BusinessPattern => ({
  id,
  name: text(input.name, 100),
  description: text(input.description),
  domainLanguage: texts(input.domainLanguage),
  commonFeatures: texts(input.commonFeatures),
  strongSignals: signals(input.strongSignals),
  weakSignals: signals(input.weakSignals),
  serviceMappings: (Array.isArray(input.serviceMappings) ? input.serviceMappings : [])
    .map((m) => ({ service: text(m?.service, 100), reason: text(m?.reason, 500) }))
    .filter((m) => m.service),
  clarifyingQuestions: texts(input.clarifyingQuestions),
  assumptions: texts(input.assumptions),
  knownUnknowns: texts(input.knownUnknowns),
});

const patternValidation = () => [
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('domainLanguage').isArray({ min: 1, max: 100 }),
  body('commonFeatures').optional().isArray({ max: 50 }),
  body('strongSignals').isArray({ min: 1, max: 50 }),
  body('strongSignals.*.description').isString().trim().isLength({ min: 1, max: 500 }),
  body('strongSignals.*.keywords').isArray({ min: 1, max: 50 }),
  body('weakSignals').optional().isArray({ max: 50 }),
  body('weakSignals.*.description').isString().trim().isLength({ min: 1, max: 500 }),
  body('weakSignals.*.keywords').isArray({ min: 1, max: 50 }),
  body('serviceMappings').isArray({ min: 1, max: 30 }),
  body('serviceMappings.*.service')
    .isString()
    .custom((service: string) => SPECIALISTS.some((s) => s.service === service))
    .withMessage('must be an ADSP specialist service'),
  body('serviceMappings.*.reason').isString().trim().isLength({ min: 1, max: 500 }),
  body('clarifyingQuestions').optional().isArray({ max: 50 }),
  body('assumptions').optional().isArray({ max: 50 }),
  body('knownUnknowns').optional().isArray({ max: 50 }),
];

// Regenerating renumbers the components, so a review follows its component by service and name.
const withPreviousReviews = (
  components: BlueprintComponent[],
  previous: BlueprintComponent[] = [],
): BlueprintComponent[] =>
  components.map((component) => {
    const review = previous.find((p) => p.service === component.service && p.name === component.name)?.review;
    return review ? { ...component, review } : component;
  });

interface AnalysisResult {
  mode: AnalysisMode;
  model?: string;
  matches: PatternMatch[];
  hypotheses: Hypothesis[];
  concepts: BusinessConcept[];
  questionTexts: string[];
  resolvedQuestionIds: string[];
  reply: string;
}

const dedupeConcepts = (existing: BusinessConcept[], incoming: BusinessConcept[]): BusinessConcept[] => {
  const known = new Set(existing.map((c) => `${c.type}:${c.name.toLowerCase()}`));
  return incoming.filter((c) => {
    const key = `${c.type}:${c.name.toLowerCase()}`;
    if (known.has(key)) {
      return false;
    }
    known.add(key);
    return true;
  });
};

interface AiFallbackWording {
  notConfigured: string;
  logFailure: string;
  warning: (reason: string) => string;
}

const ruleFallbackWording = (task: string, fallback: string): AiFallbackWording => ({
  notConfigured: `AI analysis is not configured; used ${fallback}.`,
  logFailure: `AI ${task} failed, falling back to rules`,
  warning: (reason) => `AI ${task} failed (${reason}); used ${fallback}.`,
});

export function createPlannerRouter({
  logger,
  solutionRepository,
  patternRepository,
  specialistChatRepository,
  solutionVersionRepository,
  eventService,
  auditService,
  llm,
  readAdspCatalog,
}: PlannerRouterProps): Router {
  const router = Router();
  const validateId = createValidationHandler(param('id').isUUID());
  const recordAudit = createAuditRecorder(auditService, logger);
  const solutionFor = (operation: AdminAccessOperation) => [
    getSolution(solutionRepository),
    auditAdminAccess(recordAudit, operation),
  ];
  const uploadProblemStatementFile = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PROBLEM_STATEMENT_UPLOAD_BYTES },
  });

  // Per request: whether solution content was sent to the AI model, whether any call fell back to rules, and the
  // solution and result mode to audit.
  interface AiUse {
    called: boolean;
    fellBack: boolean;
    solution?: Solution;
    mode?: AnalysisMode;
  }
  const aiUses = new WeakMap<Request, AiUse>();
  const aiUse = (req: Request): AiUse => {
    let use = aiUses.get(req);
    if (!use) {
      use = { called: false, fellBack: false };
      aiUses.set(req, use);
    }
    return use;
  };
  const noteAiCall = (req: Request, fellBack: boolean) => {
    const use = aiUse(req);
    use.called = true;
    use.fellBack = use.fellBack || fellBack;
  };
  const noteAnalyzed = (req: Request, solution: Solution, mode?: AnalysisMode) => {
    Object.assign(aiUse(req), { solution, mode });
  };

  // Recorded when the request completes, including when it fails after content was sent to the model.
  function recordAnalyzed(req: Request, endpoint: AnalyzedEndpoint, error?: unknown) {
    const use = aiUses.get(req);
    const solution = use?.solution ?? loaded(req);
    if (!use?.called || !solution) {
      return;
    }
    // The specialist is validated before the model is called, so the service is a known specialist here.
    const service = endpoint === 'consult' || endpoint === 'specialist-chat' ? req.params.service : undefined;
    const metadata: AnalyzedAuditMetadata = {
      endpoint,
      ...(!error && use.mode ? { mode: use.mode } : {}),
      model: llm?.model ?? null,
      fellBack: use.fellBack,
      ...(service ? { service } : {}),
    };
    recordAudit(SolutionAnalyzedAuditAction, {
      ...toSolutionAuditDetails(req.user, solution, { ...metadata }),
      status: toAuditStatus(error),
    });
  }

  const analyzing =
    (endpoint: AnalyzedEndpoint, handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    async (req: Request, res: Response, next: NextFunction) => {
      let error: unknown;
      try {
        await handler(req, res, (err?: unknown) => {
          error = err;
          next(err);
        });
      } finally {
        recordAnalyzed(req, endpoint, error);
      }
    };

  // Undefined keys mean the catalog could not be read; candidates are live services missing from the component map.
  async function readCatalog(): Promise<{ keys?: string[]; candidates: string[] }> {
    if (!readAdspCatalog) {
      return { candidates: [] };
    }
    try {
      const keys = await readAdspCatalog();
      const candidates = unmappedServices(catalogServices(keys));
      if (candidates.length > 0) {
        logger.warn(driftMessage(candidates));
      }
      return { keys, candidates };
    } catch (err) {
      logger.warn(`ADSP catalog read failed: ${(err as Error).message}`);
      return { candidates: [] };
    }
  }

  async function persist(req: Request, solution: Solution, operation: string, checkpoint = true) {
    const saved = await solutionRepository.save({ ...solution, updatedOn: new Date() });
    eventService.send(solutionUpdated(req.user, saved, operation));
    return checkpoint ? autoSaveVersion(req, saved) : saved;
  }

  async function autoSaveVersion(req: Request, solution: Solution): Promise<Solution> {
    const tenantId = getTenantId(req);
    const chats = await specialistChatRepository.findBySolution(tenantId, solution.id);
    const content = versionContent(solution, chats);
    const latest = await solutionVersionRepository.latest(tenantId, solution.id);
    if (latest && latest.contentHash === contentHash(content)) {
      return solution;
    }
    const version = await solutionVersionRepository.create(tenantId, solution.id, content);
    eventService.send(solutionUpdated(req.user, solution, 'version-saved'));
    return { ...solution, version: version.number };
  }

  // An undefined result means the caller should fall back to rule-based output.
  async function tryAi<T>(
    req: Request,
    requestedMode: AnalysisMode,
    run: (llm: PlannerLlm) => Promise<T>,
    wording: AiFallbackWording,
  ): Promise<{ result?: T; warning?: string }> {
    if (requestedMode !== 'ai') {
      return {};
    }
    if (!llm) {
      return { warning: wording.notConfigured };
    }
    try {
      const result = await run(llm);
      noteAiCall(req, false);
      return { result };
    } catch (err) {
      const reason = (err as Error).message;
      logger.warn(`${wording.logFailure}: ${reason}`);
      noteAiCall(req, true);
      return { warning: wording.warning(reason) };
    }
  }

  // Only the label records a fallback here; the reason is logged, not shown as a warning.
  async function buildAcceptance(
    req: Request,
    blueprint: SolutionBlueprint,
    state: SolutionState,
    mode: AnalysisMode,
  ): Promise<BlueprintAcceptance> {
    const references = acceptanceReferences(blueprint, state);
    const { result: criteria } = await tryAi(
      req,
      mode,
      async (llm) => {
        const { criteria: drafts } = await llm.acceptanceCriteria(blueprint, references);
        const checked = checkedAcceptanceCriteria(drafts, blueprint, references);
        if (!checked.length) {
          throw new Error('No criteria restated an item in the plan.');
        }
        return checked;
      },
      ruleFallbackWording('acceptance criteria', 'rule-based acceptance criteria'),
    );
    return criteria
      ? { mode: 'ai', criteria }
      : { mode: 'rules', criteria: ruleAcceptanceCriteria(blueprint, state.decisions) };
  }

  function refreshConfidence(state: SolutionState): void {
    if (state.discovery) {
      const evidence = allUserEvidence(state);
      const hasOpenQuestions = state.questions.some((q) => q.status === 'open');
      const factors = capFactors(ruleAssess(evidence), hasOpenQuestions);
      const confidence = computeConfidence(factors);
      state.discovery = {
        ...state.discovery,
        factors,
        confidence,
        ready: isDiscoveryReady(factors, confidence),
        mode: 'rules',
        warning: undefined,
      };
    }
    state.confidence = assessConfidence(state);
  }

  function applySpecialistExchangeToState(state: SolutionState, topic: string, guidance: string): SolutionState {
    if (!state.discovery || !guidance.trim()) {
      return state;
    }
    const evidence = allUserEvidence(state);
    const hasOpenQuestions = state.questions.some((q) => q.status === 'open');
    const factors = capFactors(
      applyAnswerToFactors(state.discovery.factors, topic, guidance, evidence),
      hasOpenQuestions,
    );
    const confidence = computeConfidence(factors);
    const discovery = { ...state.discovery, factors, confidence, ready: isDiscoveryReady(factors, confidence) };
    const withDiscovery = { ...state, discovery };
    return { ...withDiscovery, confidence: assessConfidence(withDiscovery) };
  }

  function announceDiscoveryChange(
    state: SolutionState,
    priorDiscovery: NonNullable<SolutionState['discovery']>,
  ): void {
    const discovery = state.discovery;
    if (!discovery || !priorDiscovery.messages.length) {
      return;
    }
    const readyChanged = priorDiscovery.ready !== discovery.ready;
    const confidenceChanged = Math.abs(priorDiscovery.confidence - discovery.confidence) >= 10;
    const modeChanged = priorDiscovery.mode !== discovery.mode;
    if (!readyChanged && !confidenceChanged && !modeChanged) {
      return;
    }
    const reply = ruleDiscoveryReply(discovery.factors, discovery.confidence, discovery.ready);
    state.discovery = {
      ...discovery,
      messages: [...discovery.messages, { role: 'assistant', content: reply, at: new Date().toISOString() }],
    };
  }

  async function runAnalysis(
    req: Request,
    solution: Solution,
    {
      text,
      mode,
      message,
      skipConfidenceRefresh,
      announceDiscoveryUpdate,
      checkpoint,
    }: {
      text: string;
      mode?: AnalysisMode;
      message?: string;
      skipConfidenceRefresh?: boolean;
      announceDiscoveryUpdate?: boolean;
      checkpoint?: boolean;
    },
  ): Promise<Solution> {
    const patterns = await getPatterns(req, patternRepository);
    const requestedMode: AnalysisMode = mode || (llm ? 'ai' : 'rules');
    const now = new Date().toISOString();
    const ai = await tryAi(
      req,
      requestedMode,
      async (llm): Promise<AnalysisResult> => {
        const analysis = await llm.analyze(text, patterns, solution.state.concepts, {
          answers: solution.state.questions
            .filter((q) => q.status === 'answered' && q.answer)
            .map((q) => ({ question: q.question, answer: q.answer })),
          conversation: [...(solution.state.discovery?.messages || []), ...(solution.state.conversation || [])].map(
            ({ role, content }) => ({ role, content }),
          ),
          message,
          openQuestions: solution.state.questions
            .filter((q) => q.status === 'open')
            .map((q) => ({ id: q.id, question: q.question })),
        });
        return {
          mode: 'ai',
          model: analysis.model,
          matches: analysis.matches,
          hypotheses: analysis.hypotheses,
          concepts: dedupeConcepts(solution.state.concepts, analysis.concepts),
          questionTexts: analysis.questions,
          resolvedQuestionIds: analysis.resolvedQuestionIds,
          reply: analysis.reply,
        };
      },
      ruleFallbackWording('analysis', 'rule-based analysis'),
    );
    const { warning } = ai;
    let result = ai.result;

    const matchText = message ? `${text}\n${message}` : text;
    const fullMatchText = solution.state.discovery
      ? `${matchText}\n${userEvidence('', solution.state.discovery.messages)}`
      : matchText;
    if (!result) {
      const matches = matchPatterns(fullMatchText, patterns);
      const hypotheses = buildHypotheses(matches, patterns);
      result = {
        mode: 'rules',
        matches,
        hypotheses,
        concepts: extractConcepts(fullMatchText, solution.state.concepts),
        questionTexts: hypotheses
          .filter((h) => h.confidence !== 'high')
          .flatMap((h) => patterns.find((p) => p.id === h.patternId)?.clarifyingQuestions || []),
        resolvedQuestionIds: [],
        reply: 'Rule-based analysis refreshed using your message. Switch to AI analysis for conversational answers.',
      };
    }

    const resolvedIds = new Set(result.resolvedQuestionIds);
    const resolutionAnswer = message || text;
    const questionsAfterResolution = solution.state.questions.map((q) =>
      q.status === 'open' && resolvedIds.has(q.id)
        ? { ...q, status: 'answered' as const, answer: resolutionAnswer }
        : q,
    );
    const retainedQuestions = dedupeOpenQuestions(questionsAfterResolution);

    const evidenceSoFar = [
      fullMatchText,
      ...retainedQuestions.filter((q) => q.answer).map((q) => q.answer as string),
    ].join('\n');
    const answeredQuestionTexts = retainedQuestions.filter((q) => q.status === 'answered').map((q) => q.question);
    const isRedundant = (text: string) =>
      isQuestionCovered(text, evidenceSoFar) ||
      answeredQuestionTexts.some((answered) => areSimilarQuestions(text, answered));
    const existingQuestions = new Set(retainedQuestions.map((q) => q.question));
    const retainedOpenTexts = retainedQuestions.filter((q) => q.status === 'open').map((q) => q.question);

    const newQuestionTexts: string[] = [];
    for (const text of result.questionTexts) {
      if (existingQuestions.has(text) || isRedundant(text)) {
        continue;
      }
      const isDuplicate =
        retainedOpenTexts.some((kept) => areSimilarQuestions(text, kept)) ||
        newQuestionTexts.some((kept) => areSimilarQuestions(text, kept));
      if (!isDuplicate) {
        newQuestionTexts.push(text);
      }
    }
    const newQuestions = newQuestionTexts.map((question) => ({
      id: randomUUID(),
      question,
      raisedBy: result.mode === 'ai' ? 'ai' : 'planner',
      status: 'open' as const,
    }));

    const conversation = [...(solution.state.conversation || [])];
    if (message) {
      conversation.push({ role: 'user', content: message, at: now });
      conversation.push({
        role: 'assistant',
        content: warning ? `${result.reply} (${warning})` : result.reply,
        at: now,
      });
    }

    const state: SolutionState = {
      ...solution.state,
      problemStatement: message ? solution.state.problemStatement : text,
      problemStatementUpdatedOn:
        !message && text !== solution.state.problemStatement ? now : solution.state.problemStatementUpdatedOn,
      concepts: [...solution.state.concepts, ...result.concepts],
      patternMatches: result.matches,
      hypotheses: result.hypotheses,
      questions: [...retainedQuestions, ...newQuestions],
      conversation,
      analysis: { mode: result.mode, model: result.model, warning, analyzedOn: now },
    };
    state.nextSteps = buildNextSteps(state);
    const priorDiscovery = state.discovery;
    if (skipConfidenceRefresh) {
      state.confidence = assessConfidence(state);
    } else {
      refreshConfidence(state);
      if (announceDiscoveryUpdate && priorDiscovery) {
        announceDiscoveryChange(state, priorDiscovery);
      }
    }
    return persist(
      req,
      { ...solution, status: solution.status === 'draft' ? 'analyzed' : solution.status, state },
      message ? 'chat' : 'analyze',
      checkpoint ?? true,
    );
  }

  router.get('/analysis/options', requirePlannerUser, (_req, res) => {
    res.send({
      modes: llm ? ['ai', 'rules'] : ['rules'],
      defaultMode: llm ? 'ai' : 'rules',
      model: llm?.model,
    });
  });

  router.get('/patterns', requirePlannerUser, async (req, res, next) => {
    try {
      res.send({ results: await getPatterns(req, patternRepository) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/patterns/:patternId', requirePlannerUser, async (req, res, next) => {
    try {
      const pattern = (await getPatterns(req, patternRepository)).find((p) => p.id === req.params.patternId);
      if (!pattern) {
        throw new NotFoundError('pattern', req.params.patternId);
      }
      res.send(pattern);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/patterns',
    requirePlannerAdmin,
    createValidationHandler(body('id').optional().matches(PATTERN_ID), ...patternValidation()),
    async (req, res, next) => {
      try {
        const id: string = req.body.id || slugify(req.body.name);
        if (!PATTERN_ID.test(id)) {
          throw new InvalidOperationError('Pattern name must produce an id of letters, numbers and hyphens.');
        }
        if ((await getPatterns(req, patternRepository)).some((p) => p.id === id)) {
          throw new InvalidOperationError(`Pattern '${id}' already exists; update it instead.`);
        }
        const pattern = await patternRepository.save(getTenantId(req), toPattern(id, req.body), req.user);
        res.status(201).send({ ...pattern, source: 'custom' });
        recordAudit(
          PatternCreatedAuditAction,
          toPatternAuditDetails(req.user, getTenantId(req), pattern, { source: 'custom' }),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  // Updating a built-in pattern stores a tenant copy that overrides it.
  router.put(
    '/patterns/:patternId',
    requirePlannerAdmin,
    createValidationHandler(param('patternId').matches(PATTERN_ID), ...patternValidation()),
    async (req, res, next) => {
      try {
        const { patternId } = req.params;
        const previous = (await getPatterns(req, patternRepository)).find((p) => p.id === patternId);
        if (!previous) {
          throw new NotFoundError('pattern', patternId);
        }
        const tenantId = getTenantId(req);
        const pattern = await patternRepository.save(tenantId, toPattern(patternId, req.body), req.user);
        const source = BUILT_IN_IDS.has(patternId) ? 'customized' : 'custom';
        res.send({ ...pattern, source });
        const { changeSet, changeSetOmitted } = toPatternChangeSet(previous, pattern);
        recordAudit(PatternUpdatedAuditAction, {
          ...toPatternAuditDetails(req.user, tenantId, pattern, {
            source,
            previousSource: previous.source,
            ...(changeSetOmitted ? { changeSetOmitted } : {}),
          }),
          changeSet,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // Deleting a customized built-in pattern restores the built-in version.
  router.delete('/patterns/:patternId', requirePlannerAdmin, async (req, res, next) => {
    try {
      const { patternId } = req.params;
      const tenantId = getTenantId(req);
      const stored = (await patternRepository.find(tenantId)).find((p) => p.id === patternId);
      const deleted = await patternRepository.delete(tenantId, patternId);
      if (!deleted) {
        const exists = (await getPatterns(req, patternRepository)).some((p) => p.id === patternId);
        if (!exists) {
          throw new NotFoundError('pattern', patternId);
        }
        throw new InvalidOperationError(
          'Built-in and configured patterns cannot be deleted; update the pattern to customize it.',
        );
      }
      res.sendStatus(204);
      recordAudit(
        PatternDeletedAuditAction,
        toPatternAuditDetails(
          req.user,
          tenantId,
          { id: patternId, name: stored?.name },
          { source: BUILT_IN_IDS.has(patternId) ? 'customized' : 'custom' },
        ),
      );
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/patterns/match',
    requirePlannerUser,
    createValidationHandler(body('text').isString().isLength({ min: 1, max: 20000 })),
    async (req, res, next) => {
      try {
        const patterns = await getPatterns(req, patternRepository);
        const matches = matchPatterns(req.body.text, patterns);
        const best = matches[0];
        res.send({
          matches,
          questions:
            best && best.level === 'low' ? patterns.find((p) => p.id === best.patternId)?.clarifyingQuestions : [],
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get('/specialists', requirePlannerUser, (_req, res) => {
    res.send({ results: SPECIALISTS });
  });

  router.post(
    '/documents/extract',
    requirePlannerUser,
    uploadProblemStatementFile.single('file'),
    async (req, res, next) => {
      try {
        const file = req.file;
        if (!file) {
          throw new InvalidOperationError('No file was uploaded.');
        }
        if (!isSupportedProblemStatementFile(file.originalname)) {
          throw new InvalidOperationError(
            `${file.originalname} is not a supported format. Upload a Markdown (.md), Word (.doc, .docx) or PDF (.pdf) file.`,
          );
        }
        let text: string;
        try {
          text = await extractProblemStatementText(file.buffer, file.originalname);
        } catch (err) {
          throw new InvalidOperationError(`Could not read ${file.originalname}: ${(err as Error).message}`);
        }
        if (!text) {
          throw new InvalidOperationError(
            `No readable text was found in ${file.originalname}. Try a different file or enter the problem statement manually.`,
          );
        }
        res.send({ text });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/solutions',
    requirePlannerUser,
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 100 }),
      query('status').optional().isIn(SOLUTION_STATUSES),
    ),
    async (req, res, next) => {
      try {
        const tenantId = getTenantId(req);
        const top = req.query.top ? parseInt(req.query.top as string) : 10;
        const result = await solutionRepository.find(top, req.query.after as string, {
          tenantId,
          status: req.query.status as Solution['status'],
          createdById: isPlannerAdmin(req.user, tenantId) ? undefined : req.user.id,
        });
        res.send(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/solutions',
    requirePlannerUser,
    createValidationHandler(
      body('name').isString().isLength({ min: 1, max: 200 }),
      body('description').optional({ nullable: true }).isString(),
      body('scenario').optional().isIn(['new', 'prototype', 'existing-app', 'reconfigure']),
      body('problemStatement').optional().isString(),
    ),
    async (req, res, next) => {
      try {
        const tenantId = getTenantId(req);
        const now = new Date();
        const solution = await solutionRepository.save({
          id: randomUUID(),
          tenantId,
          name: req.body.name,
          description: req.body.description,
          scenario: req.body.scenario || 'new',
          status: 'draft',
          createdById: req.user.id,
          createdByName: req.user.name,
          createdOn: now,
          updatedOn: now,
          version: 1,
          state: emptyState(req.body.problemStatement),
        });
        res.status(201).send(solution);
        eventService.send(solutionCreated(req.user, solution));
        recordAudit(
          SolutionCreatedAuditAction,
          toSolutionAuditDetails(req.user, solution, { scenario: solution.scenario }),
        );
        logger.info(`Created solution ${solution.name} (ID: ${solution.id}).`, {
          context: 'PlannerRouter',
          tenantId: tenantId.toString(),
          user: `${req.user.name} (ID: ${req.user.id})`,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get('/solutions/:id', requirePlannerUser, validateId, solutionFor('read'), (req, res) => {
    res.send(loaded(req));
  });

  router.patch(
    '/solutions/:id',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('name').optional().isString().isLength({ min: 1, max: 200 }),
      body('description').optional({ nullable: true }).isString(),
      body('status').optional().isIn(SOLUTION_STATUSES),
      body('problemStatement').optional().isString(),
      body('concepts').optional().isArray(),
      body('concepts.*.type')
        .optional()
        .isIn([...CONCEPT_TYPES]),
      body('concepts.*.name').optional().isString().notEmpty(),
      body('decisions').optional().isArray(),
      body('questions').optional().isArray(),
      body('checkpoint').optional().isBoolean(),
    ),
    solutionFor('update'),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const { name, description, status, problemStatement, concepts, decisions, questions } = req.body;
        const state: SolutionState = {
          ...solution.state,
          problemStatement: problemStatement ?? solution.state.problemStatement,
          concepts: concepts
            ? concepts.map((c: BusinessConcept) => ({ ...c, id: c.id || randomUUID(), source: c.source || 'user' }))
            : solution.state.concepts,
          decisions: decisions
            ? decisions.map((d: SolutionState['decisions'][number]) => ({
                ...d,
                id: d.id || randomUUID(),
                decidedOn: d.decidedOn || new Date().toISOString(),
                decidedBy: d.decidedBy || req.user.name,
              }))
            : solution.state.decisions,
          questions: questions
            ? questions.map((q: SolutionState['questions'][number]) => ({
                status: 'open',
                raisedBy: 'user',
                ...q,
                id: q.id || randomUUID(),
              }))
            : solution.state.questions,
        };
        if (problemStatement !== undefined && problemStatement !== solution.state.problemStatement) {
          state.problemStatementUpdatedOn = new Date().toISOString();
          refreshConfidence(state);
        }
        res.send(
          await persist(
            req,
            {
              ...solution,
              name: name ?? solution.name,
              description: description ?? solution.description,
              status: status ?? solution.status,
              state,
            },
            'update',
            req.body.checkpoint ?? true,
          ),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/solutions/:id',
    requirePlannerUser,
    validateId,
    solutionFor('delete'),
    requireSolutionOwner,
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const deleted = await solutionRepository.delete(solution.tenantId, solution.id);
        res.send({ deleted });
        if (deleted) {
          eventService.send(solutionDeleted(req.user, solution));
          recordAudit(
            SolutionDeletedAuditAction,
            toSolutionAuditDetails(req.user, solution, { scenario: solution.scenario, status: solution.status }),
          );
        }
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/solutions/:id/analyze',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('text').optional().isString().isLength({ max: 20000 }),
      body('mode').optional().isIn(['ai', 'rules']),
      body('checkpoint').optional().isBoolean(),
    ),
    solutionFor('update'),
    analyzing('analyze', async (req, res, next) => {
      try {
        const solution = loaded(req);
        const text = req.body.text || solution.state.problemStatement;
        if (!text) {
          throw new InvalidOperationError('Solution has no problem statement to analyze.');
        }
        const analyzed = await runAnalysis(req, solution, {
          text,
          mode: req.body.mode,
          announceDiscoveryUpdate: true,
          checkpoint: req.body.checkpoint,
        });
        res.send(analyzed);
        noteAnalyzed(req, analyzed, analyzed.state.analysis?.mode);
      } catch (err) {
        next(err);
      }
    }),
  );

  router.post(
    '/solutions/:id/discovery',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('message').optional().isString().trim().isLength({ min: 1, max: 20000 }),
      body('mode').optional().isIn(['ai', 'rules']),
      body('force').optional().isBoolean(),
      body('restart').optional().isBoolean(),
    ),
    solutionFor('update'),
    analyzing('discovery', async (req, res, next) => {
      try {
        const solution = loaded(req);
        const problem = solution.state.problemStatement.trim();
        if (!problem) {
          throw new InvalidOperationError('Enter a problem statement before starting discovery.');
        }
        const now = new Date().toISOString();
        const prior = req.body.restart ? [] : solution.state.discovery?.messages || [];
        const messages = req.body.message
          ? [...prior, { role: 'user' as const, content: req.body.message.trim(), at: now }]
          : prior;
        const requestedMode: AnalysisMode = req.body.mode || (llm ? 'ai' : 'rules');

        const { result: aiDiscovery, warning } = await tryAi(
          req,
          requestedMode,
          async (llm) => {
            const patterns = await getPatterns(req, patternRepository);
            const result = await llm.discover(
              problem,
              messages.map(({ role, content }) => ({ role, content })),
              patterns,
            );
            return { ...result, factors: normalizeFactors(result.factors, userEvidence(problem, messages)) };
          },
          ruleFallbackWording('discovery', 'rule-based discovery'),
        );
        const factors = aiDiscovery ? aiDiscovery.factors : ruleAssess(userEvidence(problem, messages));
        const model = aiDiscovery?.model;
        const mode: AnalysisMode = aiDiscovery ? 'ai' : 'rules';

        const confidence = computeConfidence(factors);
        const ready = isDiscoveryReady(factors, confidence, req.body.force === true);
        let reply = aiDiscovery?.reply || ruleDiscoveryReply(factors, confidence, ready);
        if (req.body.message) {
          const priorConfidence = solution.state.discovery?.confidence ?? 0;
          const confidenceWithoutThisReply = computeConfidence(ruleAssess(userEvidence(problem, prior)));
          const fromEarlierDetails = confidenceWithoutThisReply - priorConfidence;
          if (confidence > priorConfidence && fromEarlierDetails >= 10) {
            reply = `${reply} (Some of that increase comes from details already in the problem statement or earlier answers, not just this reply.)`;
          }
        }
        if (req.body.force === true && confidence < DISCOVERY_THRESHOLD) {
          reply = `${reply}\n\nProceeding with a proposed solution at ${confidence}% confidence, as you asked. Expect more open questions and assumptions.`;
        }

        const discovery = {
          messages: [...messages, { role: 'assistant' as const, content: reply, at: now }],
          confidence,
          threshold: DISCOVERY_THRESHOLD,
          factors,
          ready,
          mode,
          model,
          warning,
          updatedOn: now,
        };
        const withDiscovery: Solution = {
          ...solution,
          state: {
            ...solution.state,
            discovery,
            confidence: { score: confidence, threshold: DISCOVERY_THRESHOLD, factors },
          },
        };
        const saved = ready
          ? await runAnalysis(req, withDiscovery, { text: problem, mode: requestedMode, skipConfidenceRefresh: true })
          : await persist(req, withDiscovery, 'discovery');
        res.send(saved);
        noteAnalyzed(req, saved, mode);
      } catch (err) {
        next(err);
      }
    }),
  );

  router.post(
    '/solutions/:id/chat',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('message').isString().trim().isLength({ min: 1, max: 20000 }),
      body('mode').optional().isIn(['ai', 'rules']),
    ),
    solutionFor('update'),
    analyzing('chat', async (req, res, next) => {
      try {
        const solution = loaded(req);
        const message: string = req.body.message.trim();
        const refined = await runAnalysis(req, solution, {
          text: solution.state.problemStatement,
          mode: req.body.mode,
          message,
        });
        res.send(refined);
        noteAnalyzed(req, refined, refined.state.analysis?.mode);
      } catch (err) {
        next(err);
      }
    }),
  );

  router.put(
    '/solutions/:id/components/:order/review',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      param('order').isInt({ min: 1 }),
      body('review').isIn(['not-reviewed', 'approved', 'rejected']),
    ),
    solutionFor('update'),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const blueprint = solution.state.blueprint;
        const order = Number(req.params.order);
        if (!blueprint?.components?.some((c) => c.order === order)) {
          throw new NotFoundError('component', req.params.order);
        }
        const review: ComponentReview = req.body.review;
        const components = blueprint.components.map((c) => (c.order === order ? { ...c, review } : c));
        const state = { ...solution.state, blueprint: { ...blueprint, components } };
        res.send(await persist(req, { ...solution, state }, 'component-review'));
      } catch (err) {
        next(err);
      }
    },
  );

  router.use(
    createVersionRouter({
      solutionRepository,
      specialistChatRepository,
      solutionVersionRepository,
      eventService,
      recordAudit,
    }),
  );

  router.post(
    '/solutions/:id/consult/:service',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('question').optional().isString().isLength({ max: 2000 }),
      body('proposal').optional().isString().isLength({ max: 5000 }),
      body('mode').optional().isIn(['ai', 'rules']),
    ),
    solutionFor('update'),
    analyzing('consult', async (req, res, next) => {
      try {
        const solution = loaded(req);
        const { result, state } = await runConsult(req, solution, req.params.service, {
          question: req.body.question,
          proposal: req.body.proposal,
          mode: req.body.mode,
        });
        const saved = await persist(req, { ...solution, state }, 'consult');
        res.send({ ...result, solution: saved });
        noteAnalyzed(req, saved, result.advice ? 'ai' : 'rules');
      } catch (err) {
        next(err);
      }
    }),
  );

  // Consults a specialist (AI with a rules fallback) and records the exchange in the user's saved chats.
  async function runConsult(
    req: Request,
    solution: Solution,
    service: string,
    {
      question,
      proposal,
      mode,
      initiatedBy,
    }: { question?: string; proposal?: string; mode?: AnalysisMode; initiatedBy?: 'planner' },
  ): Promise<{ result: ConsultResult; state: SolutionState }> {
    const baseResult = consultSpecialist(solution.state, service);
    if (!baseResult) {
      throw new NotFoundError('specialist', service);
    }
    let result: ConsultResult = baseResult;
    if ((mode || (llm ? 'ai' : 'rules')) === 'ai' && llm) {
      try {
        const consultation = await llm.consult(solution.state, getSpecialist(service), question, proposal);
        result = mergeConsultation(baseResult, consultation);
        noteAiCall(req, false);
      } catch (err) {
        logger.warn(`AI consultation failed, using rule-based guidance: ${(err as Error).message}`);
        noteAiCall(req, true);
      }
    }
    const specialists = [
      ...solution.state.specialists.filter((s) => s.service !== result.service),
      {
        service: result.service,
        status: (solution.state.specialists.find((s) => s.service === result.service)?.status ||
          'consulted') as SpecialistStatus,
        updatedOn: new Date().toISOString(),
      },
    ];
    const [existingChat] = await specialistChatRepository.find({
      ...userChatCriteria(req),
      service: result.service,
      solutionId: solution.id,
    });
    const at = new Date().toISOString();
    const asked: string = question || 'Consult on this solution';
    await recordExchange(req, existingChat, { service: result.service, solutionId: solution.id, title: asked }, [
      {
        role: 'user',
        content: proposal ? `${asked}\n\nPlan to validate:\n${proposal}` : asked,
        at,
        intent: 'consult',
        initiatedBy,
      },
      {
        role: 'assistant',
        content: result.advice || result.reason,
        at,
        intent: 'consult',
        mode: result.advice ? 'ai' : 'rules',
        validation: result.validation,
        consult: { ...result },
      },
    ]);
    const guidance = [
      result.advice,
      result.reason,
      ...(result.supports || []),
      ...(result.constraints || []),
      ...(result.risks || []),
    ]
      .filter(Boolean)
      .join('\n');
    const state = applySpecialistExchangeToState({ ...solution.state, specialists }, asked, guidance);
    return { result, state };
  }

  router.post(
    '/solutions/:id/blueprint',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('mode').optional().isIn(['ai', 'rules']),
      body('refreshConsultations').optional().isBoolean(),
      body('checkpoint').optional().isBoolean(),
    ),
    solutionFor('update'),
    analyzing('blueprint', async (req, res, next) => {
      try {
        const solution = loaded(req);
        const hypothesis = solution.state.hypotheses[0];
        if (!hypothesis) {
          throw new InvalidOperationError('Analyze the problem before generating a blueprint.');
        }
        const requestedMode: AnalysisMode = req.body.mode || (llm ? 'ai' : 'rules');
        const chats = await specialistChatRepository.find({ ...userChatCriteria(req), solutionId: solution.id });

        // Reuse each saved consultation; consult only the recommended services that have none (or all when refreshing).
        const notes: SpecialistNote[] = [];
        let working = solution;
        for (const { service } of recommendedServices(solution.state)) {
          const chat = chats.find((c) => c.service === service);
          const saved = req.body.refreshConsultations
            ? undefined
            : [...(chat?.messages || [])].reverse().find((m) => storedConsult(m));
          const highlights = chatHighlights(chat?.messages || []);
          if (saved) {
            notes.push(toSpecialistNote(storedConsult(saved), 'saved-consultation', highlights, saved.at));
            continue;
          }
          try {
            const { result, state: updatedState } = await runConsult(req, working, service, {
              mode: requestedMode,
              initiatedBy: 'planner',
            });
            working = { ...working, state: updatedState };
            notes.push(toSpecialistNote(result, result.advice ? 'ai' : 'rules', highlights, new Date().toISOString()));
          } catch (err) {
            logger.warn(`Automatic consultation with ${service} failed: ${(err as Error).message}`);
            await recordExchange(req, chat, { service, solutionId: solution.id, title: 'Consult on this solution' }, [
              {
                role: 'assistant',
                content: 'Last consultation failed. Try consulting this specialist again.',
                at: new Date().toISOString(),
                intent: 'consult',
              },
            ]);
          }
        }

        const patterns = await getPatterns(req, patternRepository);
        const patternId = hypothesis.patternId || solution.state.patternMatches[0]?.patternId;
        const matchedPattern = patterns.find((p) => p.id === patternId);
        const matchedPatterns = solution.state.patternMatches.length
          ? solution.state.patternMatches
              .map((m) => patterns.find((p) => p.id === m.patternId))
              .filter((p): p is BusinessPattern => !!p)
          : [matchedPattern].filter((p): p is BusinessPattern => !!p);
        const ruleCore = buildRuleBlueprint(solution.state, matchedPattern);
        const catalog = await readCatalog();
        const { result: generated, warning } = await tryAi(
          req,
          requestedMode,
          async (llm) => {
            const draft = await llm.blueprint(solution.state, notes, catalog.candidates);
            return {
              core: mergeBlueprintCore(ruleCore, draft.core),
              services: draft.services,
              notCoveredByAdsp: draft.notCoveredByAdsp,
              components: draft.components,
              model: draft.model,
            };
          },
          ruleFallbackWording('blueprint', 'a rule-based blueprint'),
        );
        const core = generated ? generated.core : ruleCore;
        const details: BlueprintServiceDetail[] = generated ? generated.services : [];
        const mode: AnalysisMode = generated ? 'ai' : 'rules';
        const model = generated?.model;
        const components = withPreviousReviews(
          buildComponents(solution.state, {
            drafts: generated?.components,
            catalogKeys: catalog.keys,
            integrations: core.architecture.integrations,
          }),
          solution.state.blueprint?.components,
        );

        const blueprint = assembleBlueprint(
          solution.state,
          core,
          notes,
          { generatedOn: new Date().toISOString(), mode, model, warning },
          details,
          matchedPatterns,
          generated?.notCoveredByAdsp,
          components,
        );
        const acceptance = await buildAcceptance(req, blueprint, solution.state, mode);
        const saved = await persist(
          req,
          { ...solution, state: { ...working.state, blueprint: { ...blueprint, acceptance } } },
          'blueprint',
          req.body.checkpoint ?? true,
        );
        res.send(saved);
        noteAnalyzed(req, saved, mode);
      } catch (err) {
        next(err);
      }
    }),
  );

  const userChatCriteria = (req: Request) => ({
    tenantId: getTenantId(req),
    createdById: req.user.id,
  });

  // Chats are private to the user who had the conversation.
  const loadChat = async (req: Request, id: string): Promise<SpecialistChat> => {
    const chat = await specialistChatRepository.get(getTenantId(req), id);
    if (!chat || chat.createdById !== req.user.id) {
      throw new NotFoundError('chat', id);
    }
    return chat;
  };

  const recordExchange = (
    req: Request,
    chat: SpecialistChat | undefined,
    init: { service: string; solutionId?: string; title: string },
    exchange: StoredChatMessage[],
  ): Promise<SpecialistChat> => {
    const now = new Date();
    const existing = chat || {
      id: randomUUID(),
      tenantId: getTenantId(req),
      service: init.service,
      solutionId: init.solutionId,
      title: init.title.slice(0, 100),
      createdById: req.user.id,
      createdByName: req.user.name,
      createdOn: now,
      updatedOn: now,
      messages: [],
    };
    if (existing.messages.length + exchange.length > MAX_CHAT_MESSAGES) {
      throw new InvalidOperationError('This chat is full; start a new chat.');
    }
    return specialistChatRepository.save({
      ...existing,
      updatedOn: now,
      messages: [...existing.messages, ...exchange],
    });
  };

  const chatSummary = (chat: SpecialistChat) => ({
    id: chat.id,
    service: chat.service,
    solutionId: chat.solutionId,
    title: chat.title,
    createdOn: chat.createdOn,
    updatedOn: chat.updatedOn,
    messageCount: chat.messages.length,
  });

  const exportChat = (chat: SpecialistChat) => ({
    id: chat.id,
    service: chat.service,
    solutionId: chat.solutionId,
    title: chat.title,
    createdByName: chat.createdByName,
    createdOn: chat.createdOn,
    updatedOn: chat.updatedOn,
    messages: chat.messages,
  });

  router.get(
    '/specialists/chats',
    requirePlannerUser,
    createValidationHandler(query('service').optional().isString(), query('solutionId').optional().isUUID()),
    async (req, res, next) => {
      try {
        const chats = await specialistChatRepository.find({
          ...userChatCriteria(req),
          service: req.query.service as string,
          solutionId: req.query.solutionId as string,
        });
        res.send({ results: chats.map(chatSummary) });
      } catch (err) {
        next(err);
      }
    },
  );

  // Full history of all of the user's specialist chats, for download.
  router.get(
    '/specialists/chats/export',
    requirePlannerUser,
    createValidationHandler(query('service').optional().isString(), query('solutionId').optional().isUUID()),
    async (req, res, next) => {
      try {
        const chats = await specialistChatRepository.find({
          ...userChatCriteria(req),
          service: req.query.service as string,
          solutionId: req.query.solutionId as string,
        });
        res.setHeader('Content-Disposition', 'attachment; filename="planner-specialist-chats.json"');
        res.send({ exportedAt: new Date().toISOString(), chats: chats.map(exportChat) });
        const service = req.query.service as string;
        const solutionId = req.query.solutionId as string;
        recordAudit(
          SpecialistChatExportedAuditAction,
          toSpecialistChatAuditDetails(req.user, getTenantId(req), undefined, {
            scope: 'all',
            chatCount: chats.length,
            // Only known specialist services are recorded, since the filter is free text.
            ...(service && getSpecialist(service) ? { service } : {}),
            ...(solutionId ? { solutionId } : {}),
          }),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/specialists/chats/:chatId',
    requirePlannerUser,
    createValidationHandler(param('chatId').isUUID()),
    async (req, res, next) => {
      try {
        res.send(exportChat(await loadChat(req, req.params.chatId)));
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/specialists/chats/:chatId/export',
    requirePlannerUser,
    createValidationHandler(param('chatId').isUUID()),
    async (req, res, next) => {
      try {
        const chat = await loadChat(req, req.params.chatId);
        res.setHeader('Content-Disposition', `attachment; filename="planner-chat-${chat.id}.json"`);
        res.send({ exportedAt: new Date().toISOString(), ...exportChat(chat) });
        recordAudit(
          SpecialistChatExportedAuditAction,
          toSpecialistChatAuditDetails(req.user, chat.tenantId, chat, {
            scope: 'single',
            chatCount: 1,
            service: chat.service,
            ...(chat.solutionId ? { solutionId: chat.solutionId } : {}),
          }),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/specialists/chats/:chatId',
    requirePlannerUser,
    createValidationHandler(param('chatId').isUUID()),
    async (req, res, next) => {
      try {
        const chat = await loadChat(req, req.params.chatId);
        await specialistChatRepository.delete(getTenantId(req), chat.id);
        res.sendStatus(204);
        recordAudit(
          SpecialistChatDeletedAuditAction,
          toSpecialistChatAuditDetails(req.user, chat.tenantId, chat, {
            service: chat.service,
            ...(chat.solutionId ? { solutionId: chat.solutionId } : {}),
          }),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  // Direct access to a specialist, without requiring a planner session. History is kept per chat.
  router.post(
    '/specialists/:service/chat',
    requirePlannerUser,
    createValidationHandler(
      body('message').isString().trim().isLength({ min: 1, max: 5000 }),
      body('chatId').optional().isUUID(),
      body('intent').optional().isIn(SPECIALIST_INTENTS),
      body('solutionId').optional().isUUID(),
      body('mode').optional().isIn(['ai', 'rules']),
    ),
    analyzing('specialist-chat', async (req, res, next) => {
      try {
        const specialist = getSpecialist(req.params.service);
        if (!specialist) {
          throw new NotFoundError('specialist', req.params.service);
        }
        const message: string = req.body.message.trim();
        const intent: SpecialistIntent = req.body.intent || 'ask';

        let chat: SpecialistChat | undefined;
        if (req.body.chatId) {
          chat = await loadChat(req, req.body.chatId);
          if (chat.service !== specialist.service) {
            throw new InvalidOperationError('The chat belongs to a different specialist.');
          }
        }

        const solutionId: string = chat?.solutionId || req.body.solutionId;
        const solution = solutionId ? await loadSolution(solutionRepository, req, solutionId) : undefined;
        const state = solution?.state;
        if (solution) {
          // Without a solution no solution content is sent, so the chat is not audited as analysis.
          noteAnalyzed(req, solution);
        }

        const history: SpecialistChatMessage[] = [
          ...(chat?.messages || []).map(({ role, content }) => ({ role, content })),
          { role: 'user', content: message },
        ];
        const mode: AnalysisMode = req.body.mode || (llm ? 'ai' : 'rules');
        const { result: aiReply, warning } = await tryAi(
          req,
          mode,
          (llm) => llm.converse(specialist, history, intent, state),
          {
            notConfigured: 'AI is not configured; showing rule-based guidance.',
            logFailure: 'AI specialist chat failed, using rule-based guidance',
            warning: () => 'AI specialist was unavailable; showing rule-based guidance.',
          },
        );
        const replyMode: AnalysisMode = aiReply ? 'ai' : 'rules';
        const reply: Omit<SpecialistReply, 'model'> & { model?: string } =
          aiReply || ruleBasedSpecialistReply(specialist, intent);
        let updatedSolution: Solution | undefined;

        const at = new Date().toISOString();
        const saved = await recordExchange(req, chat, { service: specialist.service, solutionId, title: message }, [
          { role: 'user', content: message, at, intent },
          {
            role: 'assistant',
            content: reply.reply,
            at,
            intent,
            mode: replyMode,
            model: reply.model,
            warning,
            suggestions: reply.suggestions,
            samples: reply.samples,
            validation: reply.validation,
            followUps: reply.followUps,
          },
        ]);
        if (solution && state) {
          const guidance = [reply.reply, ...(reply.suggestions || []), ...(reply.followUps || [])]
            .filter(Boolean)
            .join('\n');
          const updatedState = applySpecialistExchangeToState(state, message, guidance);
          if (updatedState !== state) {
            updatedSolution = await persist(req, { ...solution, state: updatedState }, 'specialist-chat');
          }
        }
        res.send({
          chatId: saved.id,
          service: specialist.service,
          mode: replyMode,
          warning,
          ...reply,
          solution: updatedSolution,
        });
        if (solution) {
          const audited = updatedSolution || solution;
          noteAnalyzed(req, audited, replyMode);
          if (solution.createdById !== req.user.id && isPlannerAdmin(req.user, solution.tenantId)) {
            recordAudit(
              SolutionAdminAccessedAuditAction,
              toSolutionAuditDetails(req.user, audited, {
                ownerId: solution.createdById,
                operation: updatedSolution ? 'update' : 'read',
              }),
            );
          }
        }
      } catch (err) {
        next(err);
      }
    }),
  );

  return router;
}
