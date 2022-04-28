const regex = new RegExp(/^[a-zA-Z0-9-]+$/);

export const serviceItemNameCleanser = (value: string): string => {
  return !regex.test(value) ? 'Allowed characters are: a-z, A-Z, 0-9, -' : '';
};

export const serviceNamespaceCleanser = (value: string, label: string, forbidden: string[]): string => {
  if (forbidden.some((e) => e === value)) {
    return `Cannot use the word ${value} as ${label}`;
  }
  return serviceItemNameCleanser(value);
};

export interface CleansingReporter {
  add(notice: string, label: string): void;
  clearErrors(label: string): void;
}

export const reportCleansing = (notice: string, label: string, reporter: CleansingReporter): void => {
  if (notice) {
    reporter.add(notice, label);
  } else {
    reporter.clearErrors(label);
  }
};

export class ReactCleansingReporter implements CleansingReporter {
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  constructor(
    existingErrors: Record<string, string>,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) {
    this.errors = existingErrors;
    this.setErrors = setErrors;
  }

  add(error: string, label: string): void {
    const err = { ...this.errors };
    err[label] = error;
    this.setErrors(err);
  }

  clearErrors(label: string): void {
    delete this.errors[label];
    this.setErrors({ ...this.errors });
  }
}
