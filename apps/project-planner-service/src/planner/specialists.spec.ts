import { getSpecialist, SPECIALISTS } from './specialists';

describe('specialists', () => {
  describe('SPECIALISTS', () => {
    it('lists 13 specialists', () => {
      expect(SPECIALISTS).toHaveLength(13);
    });

    it('orders specialists sequentially from 1', () => {
      expect(SPECIALISTS.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });

    it('derives the workspace path from the service name without the -service suffix', () => {
      expect(SPECIALISTS.find((s) => s.service === 'form-service').workspacePath).toBe('/admin/services/form');
    });

    it('only depends on services in the catalog', () => {
      const services = SPECIALISTS.map((s) => s.service);

      expect(SPECIALISTS.flatMap((s) => s.dependsOn).filter((d) => !services.includes(d))).toEqual([]);
    });

    it('declares the form service dependency on the file service', () => {
      expect(SPECIALISTS.find((s) => s.service === 'form-service').dependsOn).toEqual(['file-service']);
    });
  });

  describe('getSpecialist', () => {
    it('finds a specialist by its full service name', () => {
      expect(getSpecialist('form-service').displayName).toBe('Form service');
    });

    it('finds a specialist by its short name', () => {
      expect(getSpecialist('form').service).toBe('form-service');
    });

    it('returns undefined for an unknown service', () => {
      expect(getSpecialist('payments')).toBeUndefined();
    });
  });
});
