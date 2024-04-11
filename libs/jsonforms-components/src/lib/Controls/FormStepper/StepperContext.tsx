import { GoAFormStepStatusType } from '@abgov/react-components-new';
import { createContext } from 'react';

export type StepInputStatus = {
  id: string;
  value: unknown;
  required: boolean;
  type: string | string[] | undefined;
  step: number;
};

export interface StatusTable {
  [key: string]: StepInputStatus;
}

export const StepperContext = createContext({
  updateStatus: (status: StepInputStatus): void => {},
  // return true because in the default case we don't want the
  // input controls to take action if it is false.
  isInitialized: (_: string): boolean => true,
  stepId: 0,
});

const isEmpty = (value: unknown): boolean => {
  return value === undefined || value === null || (typeof value === 'string' && value.length < 1);
};

export const getCompletionStatus = (table: StatusTable, step: number): GoAFormStepStatusType | undefined => {
  const nonEmptyCount = getNonEmptyCount(table, step);

  if (nonEmptyCount === 0) {
    return undefined;
  }
  const requiredCount = getRequiredCount(table, step);
  const requiredNonEmptyCount = getNonEmptyRequiredCount(table, step);
  if (requiredNonEmptyCount === requiredCount) {
    return 'complete';
  }
  return 'incomplete';
};

const getNonEmptyCount = (table: StatusTable, step: number): number => {
  const nonEmptyStatuses = Object.keys(table).filter((k) => table[k].step === step && !isEmpty(table[k].value));
  return nonEmptyStatuses.length;
};

const getRequiredCount = (table: StatusTable, step: number): number => {
  const requiredStatuses = Object.keys(table).filter((k) => {
    return table[k].step === step && table[k].required;
  });
  return requiredStatuses.length;
};

const getNonEmptyRequiredCount = (table: StatusTable, step: number): number => {
  const requiredNonEmptyStatuses = Object.keys(table).filter(
    (k) => table[k].step === step && table[k].required && !isEmpty(table[k].value)
  );
  return requiredNonEmptyStatuses.length;
};

export const logRequiredFields = (table: StatusTable, step: number) => {
  Object.keys(table)
    .filter((k) => {
      return table[k].step === step && table[k].required;
    })
    .forEach((k) => {
      if (isEmpty(table[k].value)) {
        console.log(`${table[k].id} is required for step #${step}`);
      }
    });
};
