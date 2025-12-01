export interface Validator {
  check: (value: string) => string | null;
}

export const isNotEmptyCheck = (fieldName: string): Validator => ({
  check: (value: string) => {
    return !value || value.trim() === '' ? `${fieldName} is required` : null;
  },
});

export const wordMaxLengthCheck = (maxLength: number, fieldName: string): Validator => ({
  check: (value: string) => {
    return value && value.length > maxLength ? `${fieldName} cannot exceed ${maxLength} characters` : null;
  },
});

export const badCharsCheck: Validator = {
  check: (value: string) => {
    const badChars = /[^a-zA-Z0-9\s\-_]/;
    return badChars.test(value) ? 'Name contains invalid characters' : null;
  },
};

export const duplicateNameCheck = (existingNames: string[], fieldName: string): Validator => ({
  check: (value: string) => {
    return existingNames.some((name) => name.toLowerCase() === value.toLowerCase())
      ? `${fieldName} already exists`
      : null;
  },
});

export const checkFormDefaultUrl = (): Validator => ({
  check: (url: string) => {
    if (!url || url.trim() === '') return null;

    const trimmedUrl = url.replace(/\s/g, '');
    const isHttps = trimmedUrl.toLowerCase().startsWith('https://');
    const _containsIdVariable = trimmedUrl.includes('{{id}}');
    const urlWithOutId = trimmedUrl.replace(/{{id}}/g, 'test');

    try {
      new URL(urlWithOutId);
    } catch {
      return 'Invalid URL format';
    }

    if (!isHttps) return 'Only secure HTTP protocol is allowed';

    const variableMatches = trimmedUrl.match(/\{\{.*?\}\}/g);
    if (variableMatches && variableMatches.length > 1) {
      return 'Can only contain one handlebar variable {{id}} in the url';
    }

    return null;
  },
});

export class ValidationManager {
  private validators: Record<string, { field: string; validators: Validator[] }> = {};
  private errors: Record<string, string | null> = {};

  add(key: string, field: string, ...validators: Validator[]) {
    this.validators[key] = { field, validators };
    return this;
  }

  remove(key: string) {
    delete this.errors[key];
  }

  checkAll(values: Record<string, string>) {
    let hasErrors = false;

    Object.entries(this.validators).forEach(([key, { validators }]) => {
      const value = values[key] || '';
      let error = null;

      for (const validator of validators) {
        const result = validator.check(value);
        if (result) {
          error = result;
          break;
        }
      }

      this.errors[key] = error;
      if (error) hasErrors = true;
    });

    return !hasErrors;
  }

  haveErrors() {
    return Object.values(this.errors).some((error) => error !== null);
  }

  getErrors() {
    return { ...this.errors };
  }

  clear() {
    this.errors = {};
  }

  build() {
    return {
      errors: this.getErrors(),
      validators: this,
    };
  }
}

export const useValidators = (key: string, field: string, ...validators: Validator[]) => {
  const manager = new ValidationManager();
  return manager.add(key, field, ...validators);
};
