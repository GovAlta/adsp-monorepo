import { Settings } from 'luxon';
import type { RootState } from '@store/index';
import { ServiceReportsState } from './models';
import { registerSectionLoader, resetSectionLoaders } from '@pages/admin/reports/registry/serviceReportRegistry';
import {
  criteriaKey,
  getPeriodValidationError,
  resolvePeriodRange,
  selectIsSectionStale,
  selectSectionDisplayState,
  selectSectionState,
} from './selectors';

const rootWith = (serviceReports: ServiceReportsState): RootState => ({ serviceReports } as RootState);

describe('criteriaKey', () => {
  const criteria = {
    serviceId: 'pdf',
    period: { preset: 'last30Days' as const, from: '2026-08-12', to: '2026-09-10' },
  };

  it('returns the same key for the same criteria', () => {
    expect(criteriaKey(criteria)).toBe(criteriaKey({ ...criteria, period: { ...criteria.period } }));
  });

  it('changes when the period changes', () => {
    const next = {
      ...criteria,
      period: { preset: 'last7Days' as const, from: '2026-09-04', to: '2026-09-10' },
    };

    expect(criteriaKey(next)).not.toBe(criteriaKey(criteria));
  });
});

describe('resolvePeriodRange', () => {
  const previousNow = Settings.now;
  const previousZone = Settings.defaultZone;

  beforeEach(() => {
    Settings.defaultZone = 'UTC';
    Settings.now = () => Date.parse('2026-09-10T12:00:00Z');
  });

  afterEach(() => {
    Settings.now = previousNow;
    Settings.defaultZone = previousZone;
  });

  it('resolves last7Days to an inclusive 7-day window ending today', () => {
    expect(resolvePeriodRange('last7Days')).toEqual({ from: '2026-09-04', to: '2026-09-10' });
  });

  it('resolves last30Days to an inclusive 30-day window ending today', () => {
    expect(resolvePeriodRange('last30Days')).toEqual({ from: '2026-08-12', to: '2026-09-10' });
  });

  it('resolves last90Days to an inclusive 90-day window ending today', () => {
    expect(resolvePeriodRange('last90Days')).toEqual({ from: '2026-06-13', to: '2026-09-10' });
  });

  it('resolves last12Months to a window starting 12 months before today', () => {
    expect(resolvePeriodRange('last12Months')).toEqual({ from: '2025-09-10', to: '2026-09-10' });
  });

  it('resolves custom to the last-30-days window when no dates are supplied', () => {
    expect(resolvePeriodRange('custom')).toEqual({ from: '2026-08-12', to: '2026-09-10' });
  });
});

describe('getPeriodValidationError', () => {
  it('returns nothing when a date is missing', () => {
    expect(getPeriodValidationError({ from: '', to: '2026-09-10' })).toBeUndefined();
  });

  it('returns nothing when a date is not a valid ISO date', () => {
    expect(getPeriodValidationError({ from: 'not-a-date', to: 'also-not' })).toBeUndefined();
  });

  it('accepts a span longer than 13 months', () => {
    expect(getPeriodValidationError({ from: '2020-01-01', to: '2026-09-10' })).toBeUndefined();
  });
});

describe('selectSectionState', () => {
  it('returns the same emptySection reference when the section has never been requested', () => {
    const state = rootWith({
      criteria: { serviceId: 'pdf', period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } },
      sections: {},
    });

    expect(selectSectionState('pdf', 'summary')(state)).toBe(selectSectionState('pdf', 'summary')(state));
  });
});

describe('selectSectionDisplayState', () => {
  afterEach(() => {
    resetSectionLoaders();
  });

  it('treats idle as loading when a loader is registered', () => {
    registerSectionLoader('pdf', 'summary', async () => null);
    const state = rootWith({
      criteria: { serviceId: 'pdf', period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } },
      sections: {},
    });

    expect(selectSectionDisplayState('pdf', 'summary')(state)).toEqual({ status: 'loading', data: null });
  });

  it('leaves idle unchanged when no loader is registered', () => {
    const state = rootWith({
      criteria: { serviceId: 'pdf', period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } },
      sections: {},
    });

    expect(selectSectionDisplayState('pdf', 'summary')(state).status).toBe('idle');
  });
});

describe('selectIsSectionStale', () => {
  const period = { preset: 'last30Days' as const, from: '2026-08-12', to: '2026-09-10' };

  it('is true only when loaded data belongs to different criteria', () => {
    const state = rootWith({
      criteria: { serviceId: 'pdf', period },
      sections: {
        pdf: {
          summary: {
            status: 'loaded',
            data: { pdfGenerated: 1 },
            loadedForKey: 'pdf|last7Days|2026-09-04|2026-09-10',
          },
        },
      },
    });

    expect(selectIsSectionStale('pdf', 'summary')(state)).toBe(true);
  });

  it('is false when loaded data matches the current criteria', () => {
    const state = rootWith({
      criteria: { serviceId: 'pdf', period },
      sections: {
        pdf: {
          summary: {
            status: 'loaded',
            data: { pdfGenerated: 1 },
            loadedForKey: 'pdf|last30Days|2026-08-12|2026-09-10',
          },
        },
      },
    });

    expect(selectIsSectionStale('pdf', 'summary')(state)).toBe(false);
  });
});
