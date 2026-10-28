import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Router } from 'express';
import { body, param } from 'express-validator';
import { getSolution, getTenantId, loaded, requirePlannerUser } from './access';
import { isBlueprintOutOfDate } from './blueprint';
import { solutionUpdated } from './events';
import { SolutionRepository, SolutionVersion, SolutionVersionRepository, SpecialistChatRepository } from './repository';
import { Solution, SolutionState } from './types';
import { changedSections, contentHash, versionContent, VersionContent } from './versioning';

interface VersionRouterProps {
  solutionRepository: SolutionRepository;
  specialistChatRepository: SpecialistChatRepository;
  solutionVersionRepository: SolutionVersionRepository;
  eventService: EventService;
}

interface ExportDetails {
  version: number;
  unsavedChanges: boolean;
  lastUpdated: Date;
  updatedOn: Date;
  initial: boolean;
  changedSections: string[];
}

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

function exportBody(solution: Solution, content: VersionContent, details: ExportDetails) {
  return {
    exportedAt: new Date().toISOString(),
    id: solution.id,
    name: content.name,
    description: content.description,
    scenario: content.scenario,
    status: content.status,
    createdByName: solution.createdByName,
    createdOn: solution.createdOn,
    ...details,
    blueprintOutOfDate: isBlueprintOutOfDate(content.state),
    specialistChats: content.specialistChats,
    state: withoutRejectedComponents(content.state),
  };
}

const summary = ({ number, name, createdOn }: SolutionVersion) => ({ number, name, createdOn });

export function createVersionRouter({
  solutionRepository,
  specialistChatRepository,
  solutionVersionRepository,
  eventService,
}: VersionRouterProps): Router {
  const router = Router();
  const validateId = createValidationHandler(param('id').isUUID());
  const validateVersionNumber = createValidationHandler(param('number').isInt({ min: 1 }));

  async function savedStatus(tenantId: AdspId, solution: Solution) {
    const content = versionContent(solution, await specialistChatRepository.findBySolution(tenantId, solution.id));
    const latest = await solutionVersionRepository.latest(tenantId, solution.id);
    return { content, latest, unsavedChanges: latest?.contentHash !== contentHash(content) };
  }

  async function versionChanges(tenantId: AdspId, solutionId: string, version: SolutionVersion) {
    if (version.number === 1) {
      return { initial: true, changedSections: [] };
    }
    const previous = await solutionVersionRepository.get(tenantId, solutionId, version.number - 1);
    return { initial: false, changedSections: previous ? changedSections(previous.content, version.content) : [] };
  }

  router.get(
    '/solutions/:id/export',
    requirePlannerUser,
    validateId,
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const tenantId = getTenantId(req);
        const solution = loaded(req);
        const { content, latest, unsavedChanges } = await savedStatus(tenantId, solution);
        const details = unsavedChanges
          ? {
              version: latest?.number ?? solution.version,
              unsavedChanges,
              lastUpdated: solution.updatedOn,
              initial: !latest,
              changedSections: latest ? changedSections(latest.content, content) : [],
            }
          : {
              version: latest.number,
              unsavedChanges,
              lastUpdated: latest.createdOn,
              ...(await versionChanges(tenantId, solution.id, latest)),
            };

        res.setHeader('Content-Disposition', `attachment; filename="planner-${solution.id}.json"`);
        res.send(exportBody(solution, content, { ...details, updatedOn: solution.updatedOn }));
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/solutions/:id/versions',
    requirePlannerUser,
    validateId,
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const tenantId = getTenantId(req);
        const solution = loaded(req);
        const { latest, unsavedChanges } = await savedStatus(tenantId, solution);
        res.send({
          latest: latest?.number ?? solution.version,
          unsavedChanges,
          results: await solutionVersionRepository.list(tenantId, solution.id),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/solutions/:id/versions',
    requirePlannerUser,
    validateId,
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const tenantId = getTenantId(req);
        const solution = loaded(req);
        const { content, latest, unsavedChanges } = await savedStatus(tenantId, solution);
        if (!unsavedChanges) {
          throw new InvalidOperationError(`No changes since version ${latest.number}.`);
        }
        const version = await solutionVersionRepository.create(tenantId, solution.id, content);
        res.status(201).send(summary(version));
        eventService.send(solutionUpdated(req.user, solution, 'version-saved'));
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/solutions/:id/versions/:number',
    requirePlannerUser,
    validateId,
    validateVersionNumber,
    createValidationHandler(body('name').isString().trim().isLength({ max: 100 })),
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const solution = loaded(req);
        const number = Number(req.params.number);
        const name = req.body.name || `Version ${number}`;
        const version = await solutionVersionRepository.rename(getTenantId(req), solution.id, number, name);
        if (!version) {
          throw new NotFoundError('solution version', req.params.number);
        }
        res.send(summary(version));
        eventService.send(solutionUpdated(req.user, solution, 'version-renamed'));
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/solutions/:id/versions/:number/export',
    requirePlannerUser,
    validateId,
    validateVersionNumber,
    getSolution(solutionRepository),
    async (req, res, next) => {
      try {
        const tenantId = getTenantId(req);
        const solution = loaded(req);
        const version = await solutionVersionRepository.get(tenantId, solution.id, Number(req.params.number));
        if (!version) {
          throw new NotFoundError('solution version', req.params.number);
        }

        res.setHeader('Content-Disposition', `attachment; filename="planner-${solution.id}-v${version.number}.json"`);
        res.send(
          exportBody(solution, version.content, {
            version: version.number,
            unsavedChanges: false,
            lastUpdated: version.createdOn,
            updatedOn: version.createdOn,
            ...(await versionChanges(tenantId, solution.id, version)),
          }),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
