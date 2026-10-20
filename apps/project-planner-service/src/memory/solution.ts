import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import { Solution, SolutionCriteria, SolutionRepository } from '../planner';

export class MemorySolutionRepository implements SolutionRepository {
  private solutions = new Map<string, Solution>();

  async find(top: number, after: string, criteria: SolutionCriteria): Promise<Results<Solution>> {
    const skip = decodeAfter(after) || 0;
    const topChecked = top + 1;
    const rows = [...this.solutions.values()]
      .filter(
        (s) =>
          s.tenantId.toString() === criteria.tenantId.toString() &&
          (!criteria.createdById || s.createdById === criteria.createdById) &&
          (!criteria.status || s.status === criteria.status),
      )
      .sort((a, b) => b.updatedOn.getTime() - a.updatedOn.getTime())
      .slice(skip, skip + topChecked);

    return {
      results: rows.slice(0, top),
      page: {
        after,
        next: encodeNext(rows.length, topChecked, skip - 1),
        size: rows.length > top ? top : rows.length,
      },
    };
  }

  async get(tenantId: AdspId, id: string): Promise<Solution | null> {
    const solution = this.solutions.get(id);
    return solution?.tenantId.toString() === tenantId.toString() ? solution : null;
  }

  async save(solution: Solution): Promise<Solution> {
    const existing = this.solutions.get(solution.id);
    if (existing && existing.tenantId.toString() !== solution.tenantId.toString()) {
      throw new InvalidOperationError('Solution belongs to a different tenant.');
    }
    this.solutions.set(solution.id, solution);
    return solution;
  }

  async delete(tenantId: AdspId, id: string): Promise<boolean> {
    return !!(await this.get(tenantId, id)) && this.solutions.delete(id);
  }
}
