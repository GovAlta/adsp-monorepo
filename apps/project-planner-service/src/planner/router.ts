import { AdspId, EventService, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { Request, RequestHandler, Router } from 'express';
import { body, param, query } from 'express-validator';
import { Logger } from 'winston';
import { buildHypotheses, buildNextSteps, ConsultResult, consultSpecialist, extractConcepts, matchPatterns } from './analysis';
import { solutionCreated, solutionDeleted, solutionUpdated } from './events';
import { mergeConsultation, PlannerLlm } from './llm';
import { BUILT_IN_PATTERNS } from './patterns';
import { SolutionRepository } from './repository';
import { PlannerServiceRoles } from './roles';
import { getSpecialist, SPECIALISTS } from './specialists';
import {
  AnalysisMode,
  BusinessConcept,
  BusinessPattern,
  CONCEPT_TYPES,
  Hypothesis,
  PatternMatch,
  PlannerConfiguration,
  Solution,
  SolutionState,
  SpecialistStatus,
} from './types';

interface PlannerRouterProps {
  apiId: AdspId;
  logger: Logger;
  solutionRepository: SolutionRepository;
  eventService: EventService;
  // When provided, AI analysis is available and is the default mode.
  llm?: PlannerLlm;
}

const SOLUTION_KEY = 'solution';
const SPECIALIST_STATUSES: SpecialistStatus[] = ['not-started', 'consulted', 'in-workspace', 'completed'];
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
  artifacts: [],
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

async function getPatterns(req: Request): Promise<BusinessPattern[]> {
  const [config] = await req.getConfiguration<PlannerConfiguration>();
  const overrides = config?.patterns || {};
  const merged = new Map(BUILT_IN_PATTERNS.map((p) => [p.id, p]));
  Object.values(overrides).forEach((p) =>
    merged.set(p.id, { weakSignals: [], clarifyingQuestions: [], assumptions: [], knownUnknowns: [], description: '', ...p }),
  );
  return [...merged.values()];
}

export const requirePlannerUser: RequestHandler = (req, _res, next) => {
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

export const getSolution =
  (repository: SolutionRepository): RequestHandler =>
  async (req, _res, next) => {
    try {
      const tenantId = getTenantId(req);
      const solution = await repository.get(tenantId, req.params.id);
      if (!solution) {
        throw new NotFoundError('solution', req.params.id);
      }
      if (solution.createdById !== req.user.id && !isPlannerAdmin(req.user, tenantId)) {
        throw new UnauthorizedUserError('access solution', req.user);
      }
      req[SOLUTION_KEY] = solution;
      next();
    } catch (err) {
      next(err);
    }
  };

const loaded = (req: Request): Solution => req[SOLUTION_KEY];

interface AnalysisResult {
  mode: AnalysisMode;
  model?: string;
  matches: PatternMatch[];
  hypotheses: Hypothesis[];
  concepts: BusinessConcept[];
  questionTexts: string[];
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

async function persist(
  req: Request,
  repository: SolutionRepository,
  eventService: EventService,
  solution: Solution,
  operation: string,
) {
  const saved = await repository.save({ ...solution, updatedOn: new Date(), revision: solution.revision + 1 });
  eventService.send(solutionUpdated(req.user, saved, operation));
  return saved;
}

export function createPlannerRouter({ logger, solutionRepository, eventService, llm }: PlannerRouterProps): Router {
  const router = Router();
  const validateId = createValidationHandler(param('id').isUUID());

  router.get('/analysis/options', requirePlannerUser, (_req, res) => {
    res.send({
      modes: llm ? ['ai', 'rules'] : ['rules'],
      defaultMode: llm ? 'ai' : 'rules',
      model: llm?.model,
    });
  });

  router.get('/patterns', requirePlannerUser, async (req, res, next) => {
    try {
      res.send({ results: await getPatterns(req) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/patterns/:patternId', requirePlannerUser, async (req, res, next) => {
    try {
      const pattern = (await getPatterns(req)).find((p) => p.id === req.params.patternId);
      if (!pattern) {
        throw new NotFoundError('pattern', req.params.patternId);
      }
      res.send(pattern);
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
        const patterns = await getPatterns(req);
        const matches = matchPatterns(req.body.text, patterns);
        const best = matches[0];
        res.send({
          matches,
          questions: best && best.level === 'low' ? patterns.find((p) => p.id === best.patternId)?.clarifyingQuestions : [],
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
      body('problemStatement').optional().isString().isLength({ max: 20000 }),
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
          revision: 1,
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
      body('problemStatement').optional().isString().isLength({ max: 20000 }),
      body('concepts').optional().isArray(),
      body('concepts.*.type').optional().isIn([...CONCEPT_TYPES]),
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
        res.send(
          await persist(
            req,
            solutionRepository,
            eventService,
            { ...solution, name: name ?? solution.name, description: description ?? solution.description, status: status ?? solution.status, state },
            'update',
          ),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete('/solutions/:id', requirePlannerUser, validateId, getSolution(solutionRepository), async (req, res, next) => {
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
  });

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
        const patterns = await getPatterns(req);
        const text = req.body.text || solution.state.problemStatement;
        if (!text) {
          throw new InvalidOperationError('Solution has no problem statement to analyze.');
        }

        const requestedMode: AnalysisMode = req.body.mode || (llm ? 'ai' : 'rules');
        let result: AnalysisResult | undefined;
        let warning: string | undefined;
        if (requestedMode === 'ai') {
          if (!llm) {
            warning = 'AI analysis is not configured; used rule-based analysis.';
          } else {
            try {
              const analysis = await llm.analyze(text, patterns, solution.state.concepts);
              result = {
                mode: 'ai',
                model: analysis.model,
                matches: analysis.matches,
                hypotheses: analysis.hypotheses,
                concepts: dedupeConcepts(solution.state.concepts, analysis.concepts),
                questionTexts: analysis.questions,
              };
            } catch (err) {
              logger.warn(`AI analysis failed, falling back to rules: ${(err as Error).message}`);
              warning = `AI analysis failed (${(err as Error).message}); used rule-based analysis.`;
            }
          }
        }
        if (!result) {
          const matches = matchPatterns(text, patterns);
          const hypotheses = buildHypotheses(matches, patterns);
          result = {
            mode: 'rules',
            matches,
            hypotheses,
            concepts: extractConcepts(text, solution.state.concepts),
            questionTexts: hypotheses
              .filter((h) => h.confidence !== 'high')
              .flatMap((h) => patterns.find((p) => p.id === h.patternId)?.clarifyingQuestions || []),
          };
        }

        const existingQuestions = new Set(solution.state.questions.map((q) => q.question));
        const newQuestions = result.questionTexts
          .filter((q, i, all) => !existingQuestions.has(q) && all.indexOf(q) === i)
          .map((question) => ({
            id: randomUUID(),
            question,
            raisedBy: result.mode === 'ai' ? 'ai' : 'planner',
            status: 'open' as const,
          }));

        const state: SolutionState = {
          ...solution.state,
          problemStatement: text,
          concepts: [...solution.state.concepts, ...result.concepts],
          patternMatches: result.matches,
          hypotheses: result.hypotheses,
          questions: [...solution.state.questions, ...newQuestions],
          analysis: { mode: result.mode, model: result.model, warning, analyzedOn: new Date().toISOString() },
        };
        state.nextSteps = buildNextSteps(state);
        res.send(
          await persist(
            req,
            solutionRepository,
            eventService,
            { ...solution, status: solution.status === 'draft' ? 'analyzed' : solution.status, state },
            'analyze',
          ),
        );
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
      body('mode').optional().isIn(['ai', 'rules']),
    ),
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const baseResult = consultSpecialist(solution.state, req.params.service);
        if (!baseResult) {
          throw new NotFoundError('specialist', req.params.service);
        }
        let result: ConsultResult = baseResult;
        const mode: AnalysisMode = req.body.mode || (llm ? 'ai' : 'rules');
        if (mode === 'ai' && llm) {
          try {
            const consultation = await llm.consult(solution.state, getSpecialist(req.params.service), req.body.question);
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
        await persist(req, solutionRepository, eventService, { ...solution, state: { ...solution.state, specialists } }, 'consult');
        res.send(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/solutions/:id/handoff/:service',
    requirePlannerUser,
    validateId,
    createValidationHandler(
      body('status').optional().isIn(SPECIALIST_STATUSES),
      body('notes').optional().isString(),
    ),
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const specialist = getSpecialist(req.params.service);
        if (!specialist) {
          throw new NotFoundError('specialist', req.params.service);
        }
        const specialists = [
          ...solution.state.specialists.filter((s) => s.service !== specialist.service),
          {
            service: specialist.service,
            status: (req.body.status || 'in-workspace') as SpecialistStatus,
            notes: req.body.notes,
            updatedOn: new Date().toISOString(),
          },
        ];
        const state = { ...solution.state, specialists };
        const saved = await persist(
          req,
          solutionRepository,
          eventService,
          { ...solution, status: 'in-progress', state },
          'handoff',
        );
        res.send({
          workspacePath: specialist.workspacePath,
          context: {
            solutionId: saved.id,
            problemStatement: state.problemStatement,
            decisions: state.decisions,
            concepts: state.concepts,
            recommendation: state.hypotheses
              .flatMap((h) => h.recommendations)
              .find((r) => r.service === specialist.service),
          },
          solution: saved,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
