import dashify from 'dashify';

export const toKebabName = (value: string): string => {
  return dashify(value);
};
