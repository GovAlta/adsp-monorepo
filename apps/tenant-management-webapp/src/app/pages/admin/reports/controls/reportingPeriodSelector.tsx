import { GoabDatePicker, GoabDropdown, GoabDropdownItem, GoabFormItem } from '@abgov/react-components';
import { GoabDatePickerOnChangeDetail, GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
import { DateTime } from 'luxon';
import React, { FunctionComponent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { REPORT_PERIOD_PRESETS, ReportPeriodPreset } from '@store/serviceReports/models';
import { getPeriodValidationError, MAX_CUSTOM_PERIOD_MONTHS, resolvePeriodRange } from '@store/serviceReports/selectors';
import { ReportingPeriodFields } from '../styled-components';

const PRESET_LABELS: Record<ReportPeriodPreset, string> = {
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  last90Days: 'Last 90 days',
  last12Months: 'Last 12 months',
  custom: 'Custom',
};

const isPreset = (value: string): value is ReportPeriodPreset =>
  (REPORT_PERIOD_PRESETS as string[]).includes(value);

export const ReportingPeriodSelector: FunctionComponent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPreset = searchParams.get('preset');
  const preset: ReportPeriodPreset = rawPreset && isPreset(rawPreset) ? rawPreset : 'last30Days';
  const derived = resolvePeriodRange(preset === 'custom' ? 'last30Days' : preset);
  const from = searchParams.get('from') || derived.from;
  const to = searchParams.get('to') || derived.to;
  const today = DateTime.now().toISODate();
  const fromMin = DateTime.fromISO(to).minus({ months: MAX_CUSTOM_PERIOD_MONTHS }).toISODate();
  const validationError = preset === 'custom' ? getPeriodValidationError({ from, to }) : undefined;

  const writeParams = (nextPreset: ReportPeriodPreset, nextFrom?: string, nextTo?: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('preset', nextPreset);
    if (nextPreset === 'custom') {
      next.set('from', nextFrom || from);
      next.set('to', nextTo || to);
    } else {
      next.delete('from');
      next.delete('to');
    }
    setSearchParams(next);
  };

  const onPresetChange = (detail: GoabDropdownOnChangeDetail) => {
    const nextPreset = detail.value && detail.value.toString();
    if (!nextPreset || !isPreset(nextPreset)) {
      return;
    }
    if (nextPreset === 'custom') {
      const range = resolvePeriodRange(preset === 'custom' ? 'last30Days' : preset);
      writeParams('custom', searchParams.get('from') || range.from, searchParams.get('to') || range.to);
      return;
    }
    writeParams(nextPreset);
  };

  const onFromChange = (detail: GoabDatePickerOnChangeDetail) => {
    writeParams('custom', detail.valueStr, to);
  };

  const onToChange = (detail: GoabDatePickerOnChangeDetail) => {
    writeParams('custom', from, detail.valueStr);
  };

  return (
    <ReportingPeriodFields>
      <GoabFormItem label="Reporting period" maxWidth="100%">
        <GoabDropdown
          name="Reporting period"
          size="compact"
          value={preset}
          testId="reports-period-selector"
          onChange={onPresetChange}
        >
          {REPORT_PERIOD_PRESETS.map((value) => (
            <GoabDropdownItem key={value} value={value} label={PRESET_LABELS[value]} />
          ))}
        </GoabDropdown>
      </GoabFormItem>
      {preset === 'custom' && (
        <>
          <GoabFormItem label="From" error={validationError} maxWidth="100%">
            <GoabDatePicker
              name="from"
              type="calendar"
              value={from}
              min={fromMin}
              max={to < today ? to : today}
              error={Boolean(validationError)}
              width="100%"
              testId="reports-period-from"
              onChange={onFromChange}
            />
          </GoabFormItem>
          <GoabFormItem label="To" error={from > to ? validationError : undefined} maxWidth="100%">
            <GoabDatePicker
              name="to"
              type="calendar"
              value={to}
              min={from}
              max={today}
              error={from > to}
              width="100%"
              testId="reports-period-to"
              onChange={onToChange}
            />
          </GoabFormItem>
        </>
      )}
    </ReportingPeriodFields>
  );
};
