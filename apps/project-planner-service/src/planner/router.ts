import { AdspId, EventService, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { Request, RequestHandler, Router } from 'express';
import { body, param, query } from 'express-validator';
import { Logger } from 'winston';
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
  isBlueprintOutOfDate,
  mergeBlueprintCore,
  recommendedServices,
  storedConsult,
  toSpecialistNote,
} from './blueprint';
import { buildComponents, catalogServices, driftMessage, unmappedServices } from './components';
import {
  allUserEvidence,
  applyAnswerToFactors,
  areSimilarQuestions,
  assessConfidence,
  capFactors,
  computeConfidence,
  dedupeOpenQuestions,
  DISCOVERY_THRESHOLD,
  isQuestionCovered,
  normalizeFactors,
  ruleAssess,
  ruleDiscoveryReply,
  userEvidence,
} from './discovery';
import { solutionCreated, solutionDeleted, solutionUpdated } from './events';
import { mergeConsultation, PlannerLlm, SpecialistChatMessage, SpecialistIntent, SpecialistReply } from './llm';
import { BUILT_IN_PATTERNS } from './patterns';
import { PatternRepository, SolutionRepository, SpecialistChatRepository } from './repository';
import { PlannerServiceRoles } from './roles';
import { getSpecialist, ruleBasedSpecialistReply, SPECIALISTS } from './specialists';
import {
  AnalysisMode,
  BusinessConcept,
  BlueprintComponent,
  BusinessPattern,
  CONCEPT_TYPES,
  ComponentReview,
  Hypothesis,
  PatternMatch,
  PlannerConfiguration,
  Solution,
  SolutionState,
  SpecialistChat,
  SpecialistNote,
  SpecialistStatus,
  StoredChatMessage,
} from './types';
import { changedSections, classifyBump, nextVersion, sectionHashes, VersionBump } from './versioning';

interface PlannerRouterProps {
  logger: Logger;
  solutionRepository: SolutionRepository;
  patternRepository: PatternRepository;
  specialistChatRepository: SpecialistChatRepository;
  eventService: EventService;
  // When provided, AI analysis is available and is the default mode.
  llm?: PlannerLlm;
  // Reads the keys of the live ADSP configuration catalog, used to find services missing from the component map.
  readAdspCatalog?: () => Promise<string[]>;
}

const SOLUTION_KEY = 'solution';
const MAX_CHAT_MESSAGES = 200;
const SPECIALIST_INTENTS: SpecialistIntent[] = ['ask', 'recommend', 'design', 'validate', 'sample'];
const SOLUTION_STATUSES = ['draft', 'analyzed', 'in-progress', 'completed', 'archived'];
const ALL_ROLES = [PlannerServiceRoles.Admin, PlannerServiceRoles.User];

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

const getTenantId = (req: Request): AdspId => {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new InvalidOperationError('Cannot perform planner operation without tenant context.');
  }
  return tenantId;
};

const isPlannerAdmin = (user: User, tenantId: AdspId) => isAllowedUser(user, tenantId, PlannerServiceRoles.Admin);

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

const requirePlannerUser: RequestHandler = (req, _res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!isAllowedUser(req.user, tenantId, ALL_ROLES)) {
      throw new UnauthorizedUserError('access planner', req.user);
    }
    next();
  } catch (err) {
    next(err);
  }
};

const requirePlannerAdmin: RequestHandler = (req, _res, next) => {
  try {
    if (!isPlannerAdmin(req.user, getTenantId(req))) {
      throw new UnauthorizedUserError('manage patterns', req.user);
    }
    next();
  } catch (err) {
    next(err);
  }
};

async function loadSolution(repository: SolutionRepository, req: Request, id: string): Promise<Solution> {
  const tenantId = getTenantId(req);
  const solution = await repository.get(tenantId, id);
  if (!solution) {
    throw new NotFoundError('solution', id);
  }
  if (solution.createdById !== req.user.id && !isPlannerAdmin(req.user, tenantId)) {
    throw new UnauthorizedUserError('access solution', req.user);
  }
  const defaulted: Solution = {
    version: '1.0',
    versionHistory: [],
    lastExportHashes: {},
    exportedOnce: false,
    ...solution,
  };
  if (!defaulted.exportedOnce && defaulted.versionHistory.length > 0) {
    defaulted.exportedOnce = true;
  }
  return defaulted;
}

const getSolution =
  (repository: SolutionRepository): RequestHandler =>
  async (req, _res, next) => {
    try {
      req[SOLUTION_KEY] = await loadSolution(repository, req, req.params.id);
      next();
    } catch (err) {
      next(err);
    }
  };

const loaded = (req: Request): Solution => req[SOLUTION_KEY];

// The user rejected these, so the harness never sees them; the saved solution keeps them.
const withoutRejectedComponents = (state: SolutionState): SolutionState =>
  state.blueprint?.components
    ? {
        ...state,
        blueprint: {
          ...state.blueprint,
          components: state.blueprint.components.filter((c) => c.review !== 'rejected'),
        },
      }
    : state;

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
  eventService,
  llm,
  readAdspCatalog,
}: PlannerRouterProps): Router {
  const router = Router();
  const validateId = createValidationHandler(param('id').isUUID());

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

  async function persist(req: Request, solution: Solution, operation: string) {
    const saved = await solutionRepository.save({ ...solution, updatedOn: new Date() });
    eventService.send(solutionUpdated(req.user, saved, operation));
    return saved;
  }

  // An undefined result means the caller should fall back to rule-based output.
  async function tryAi<T>(
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
      return { result: await run(llm) };
    } catch (err) {
      const reason = (err as Error).message;
      logger.warn(`${wording.logFailure}: ${reason}`);
      return { warning: wording.warning(reason) };
    }
  }

  async function refreshConfidence(req: Request, state: SolutionState, mode?: AnalysisMode): Promise<void> {
    if (state.discovery) {
      const requestedMode: AnalysisMode = mode || (llm ? 'ai' : 'rules');
      const evidence = allUserEvidence(state);
      const { result: aiFactors, warning } = await tryAi(
        requestedMode,
        async (llm) => {
          const patterns = await getPatterns(req, patternRepository);
          const recent = [...(state.discovery?.messages || []), ...(state.conversation || [])].map(
            ({ role, content }) => ({ role, content }),
          );
          const discovered = await llm.discover(state.problemStatement, recent, patterns);
          return normalizeFactors(discovered.factors, evidence);
        },
        ruleFallbackWording('scoring', 'rule-based scoring'),
      );
      const rawFactors = aiFactors ?? ruleAssess(evidence);
      const hasOpenQuestions = state.questions.some((q) => q.status === 'open');
      const factors = capFactors(rawFactors, hasOpenQuestions);
      const confidence = computeConfidence(factors);
      // The warning reflects this attempt only, so switching to rules mode clears a stale AI failure note.
      state.discovery = { ...state.discovery, factors, confidence, ready: confidence >= DISCOVERY_THRESHOLD, warning };
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
    const discovery = { ...state.discovery, factors, confidence, ready: confidence >= DISCOVERY_THRESHOLD };
    const withDiscovery = { ...state, discovery };
    return { ...withDiscovery, confidence: assessConfidence(withDiscovery) };
  }

  async function runAnalysis(
    req: Request,
    solution: Solution,
    {
      text,
      mode,
      message,
      skipConfidenceRefresh,
    }: { text: string; mode?: AnalysisMode; message?: string; skipConfidenceRefresh?: boolean },
  ): Promise<Solution> {
    const patterns = await getPatterns(req, patternRepository);
    const requestedMode: AnalysisMode = mode || (llm ? 'ai' : 'rules');
    const now = new Date().toISOString();
    const ai = await tryAi(
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
    if (skipConfidenceRefresh) {
      state.confidence = assessConfidence(state);
    } else {
      await refreshConfidence(req, state, requestedMode);
    }
    return persist(
      req,
      { ...solution, status: solution.status === 'draft' ? 'analyzed' : solution.status, state },
      message ? 'chat' : 'analyze',
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
        if (!(await getPatterns(req, patternRepository)).some((p) => p.id === patternId)) {
          throw new NotFoundError('pattern', patternId);
        }
        const pattern = await patternRepository.save(getTenantId(req), toPattern(patternId, req.body), req.user);
        res.send({ ...pattern, source: BUILT_IN_IDS.has(patternId) ? 'customized' : 'custom' });
      } catch (err) {
        next(err);
      }
    },
  );

  // Deleting a customized built-in pattern restores the built-in version.
  router.delete('/patterns/:patternId', requirePlannerAdmin, async (req, res, next) => {
    try {
      const { patternId } = req.params;
      const deleted = await patternRepository.delete(getTenantId(req), patternId);
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
      body('problemStatement').optional().isString().isLength({ max: 100000 }),
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
          version: '1.0',
          versionHistory: [],
          lastExportHashes: {},
          exportedOnce: false,
          state: emptyState(req.body.problemStatement),
        });
        res.status(201).send(solution);
        eventService.send(solutionCreated(req.user, solution));
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

  router.get('/solutions/:id', requirePlannerUser, validateId, getSolution(solutionRepository), (req, res) => {
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
      body('problemStatement').optional().isString().isLength({ max: 100000 }),
      body('concepts').optional().isArray(),
      body('concepts.*.type')
        .optional()
        .isIn([...CONCEPT_TYPES]),
      body('concepts.*.name').optional().isString().notEmpty(),
      body('decisions').optional().isArray(),
      body('questions').optional().isArray(),
    ),
    getSolution(solutionRepository),
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
          await refreshConfidence(req, state);
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
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const deleted = await solutionRepository.delete(solution.tenantId, solution.id);
        res.send({ deleted });
        if (deleted) {
          eventService.send(solutionDeleted(req.user, solution));
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
    ),
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const text = req.body.text || solution.state.problemStatement;
        if (!text) {
          throw new InvalidOperationError('Solution has no problem statement to analyze.');
        }
        res.send(await runAnalysis(req, solution, { text, mode: req.body.mode }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/solutions/:id/discovery',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('message').optional().isString().trim().isLength({ min: 1, max: 5000 }),
      body('mode').optional().isIn(['ai', 'rules']),
      body('force').optional().isBoolean(),
      body('restart').optional().isBoolean(),
    ),
    getSolution(solutionRepository),
    async (req, res, next) => {
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
        const ready = confidence >= DISCOVERY_THRESHOLD || req.body.force === true;
        let reply = aiDiscovery?.reply || ruleDiscoveryReply(factors, confidence, ready);
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
        res.send(
          ready
            ? await runAnalysis(req, withDiscovery, { text: problem, mode: requestedMode, skipConfidenceRefresh: true })
            : await persist(req, withDiscovery, 'discovery'),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/solutions/:id/chat',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('message').isString().trim().isLength({ min: 1, max: 5000 }),
      body('mode').optional().isIn(['ai', 'rules']),
    ),
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const message: string = req.body.message.trim();
        res.send(
          await runAnalysis(req, solution, { text: solution.state.problemStatement, mode: req.body.mode, message }),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    '/solutions/:id/questions/:questionId',
    requirePlannerUser,
    validateId,
    createValidationHandler(param('questionId').isUUID(), body('answer').isString().isLength({ max: 5000 })),
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const existing = solution.state.questions.find((q) => q.id === req.params.questionId);
        if (!existing) {
          throw new NotFoundError('question', req.params.questionId);
        }
        const answer: string = req.body.answer.trim();
        const updatedQuestions = solution.state.questions.map((q) =>
          q.id === existing.id
            ? answer
              ? { ...q, status: 'answered' as const, answer }
              : { id: q.id, question: q.question, raisedBy: q.raisedBy, status: 'open' as const }
            : q,
        );
        const questions = answer ? dedupeOpenQuestions(updatedQuestions) : updatedQuestions;
        const state = { ...solution.state, questions };
        state.nextSteps = buildNextSteps(state);
        const hadOpenQuestions = solution.state.questions.some((q) => q.status === 'open');
        const hasOpenQuestions = questions.some((q) => q.status === 'open');
        if (state.discovery && answer) {
          const evidence = allUserEvidence(state);
          const factors = capFactors(
            applyAnswerToFactors(state.discovery.factors, existing.question, answer, evidence),
            hasOpenQuestions,
          );
          const confidence = computeConfidence(factors);
          state.discovery = { ...state.discovery, factors, confidence, ready: confidence >= DISCOVERY_THRESHOLD };
        }
        if (llm && answer && hadOpenQuestions && !hasOpenQuestions) {
          await refreshConfidence(req, state, state.analysis?.mode);
        } else {
          state.confidence = assessConfidence(state);
        }
        res.send(await persist(req, { ...solution, state }, 'answer'));
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    '/solutions/:id/components/:order/review',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      param('order').isInt({ min: 1 }),
      body('review').isIn(['not-reviewed', 'approved', 'rejected']),
    ),
    getSolution(solutionRepository),
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

  router.get(
    '/solutions/:id/export',
    requirePlannerUser,
    validateId,
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const currentHashes = sectionHashes(solution);
        const changed = changedSections(solution.lastExportHashes, currentHashes);
        const isInitial = !solution.exportedOnce;
        const bump: VersionBump = isInitial ? 'none' : classifyBump(changed);

        let { version, versionHistory } = solution;
        let lastUpdated = versionHistory[versionHistory.length - 1]?.changedAt || solution.updatedOn.toISOString();
        if (bump !== 'none') {
          version = nextVersion(solution.version, bump);
          const changedAt = new Date().toISOString();
          versionHistory = [
            ...versionHistory,
            { version, changedAt, changedBy: req.user.name, changedSections: changed },
          ];
          lastUpdated = changedAt;
        }
        if (bump !== 'none' || isInitial) {
          await solutionRepository.save({
            ...solution,
            version,
            versionHistory,
            lastExportHashes: currentHashes,
            exportedOnce: true,
          });
        }

        res.setHeader('Content-Disposition', `attachment; filename="planner-${solution.id}.json"`);
        res.send({
          exportedAt: new Date().toISOString(),
          id: solution.id,
          name: solution.name,
          description: solution.description,
          scenario: solution.scenario,
          status: solution.status,
          createdByName: solution.createdByName,
          createdOn: solution.createdOn,
          updatedOn: solution.updatedOn,
          version,
          lastUpdated,
          changedSections: bump === 'none' ? [] : changed,
          initial: isInitial,
          blueprintOutOfDate: isBlueprintOutOfDate(solution.state),
          versionHistory,
          state: withoutRejectedComponents(solution.state),
        });
      } catch (err) {
        next(err);
      }
    },
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
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const { result, state } = await runConsult(req, solution, req.params.service, {
          question: req.body.question,
          proposal: req.body.proposal,
          mode: req.body.mode,
        });
        const saved = await persist(req, { ...solution, state }, 'consult');
        res.send({ ...result, solution: saved });
      } catch (err) {
        next(err);
      }
    },
  );

  // Consults a specialist (AI with a rules fallback) and records the exchange in the user's saved chats.
  async function runConsult(
    req: Request,
    solution: Solution,
    service: string,
    { question, proposal, mode }: { question?: string; proposal?: string; mode?: AnalysisMode },
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
      } catch (err) {
        logger.warn(`AI consultation failed, using rule-based guidance: ${(err as Error).message}`);
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
      { role: 'user', content: proposal ? `${asked}\n\nPlan to validate:\n${proposal}` : asked, at, intent: 'consult' },
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
    ),
    getSolution(solutionRepository),
    async (req, res, next) => {
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
          const { result, state: updatedState } = await runConsult(req, working, service, { mode: requestedMode });
          working = { ...working, state: updatedState };
          notes.push(toSpecialistNote(result, result.advice ? 'ai' : 'rules', highlights, new Date().toISOString()));
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
        res.send(await persist(req, { ...solution, state: { ...working.state, blueprint } }, 'blueprint'));
      } catch (err) {
        next(err);
      }
    },
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
    async (req, res, next) => {
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

        const history: SpecialistChatMessage[] = [
          ...(chat?.messages || []).map(({ role, content }) => ({ role, content })),
          { role: 'user', content: message },
        ];
        const mode: AnalysisMode = req.body.mode || (llm ? 'ai' : 'rules');
        const { result: aiReply, warning } = await tryAi(
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
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
