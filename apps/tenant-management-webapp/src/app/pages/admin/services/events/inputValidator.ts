const regex = new RegExp(/^[a-zA-Z0-9-]+$/);

export const nameValidator = (
  value: string,
  label: string,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  errors: Record<string, string>
): void => {
  if (!regex.test(value)) {
    const err = { ...errors };
    err[label] = 'allowed characters: a-z, A-Z, 0-9, -';
    setErrors(err);
  } else {
    delete errors[label];
    setErrors({ ...errors });
  }
};

export const namespaceValidator = (
  value: string,
  label: string,
  forbidden: string[],
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  errors: Record<string, string>
): void => {
  if (forbidden.some((e) => e === value)) {
    const err = { ...errors };
    err[label] = `cannot use the word ${value} as ${label}`;
    setErrors(err);
  } else {
    nameValidator(value, label, setErrors, errors);
  }
};
