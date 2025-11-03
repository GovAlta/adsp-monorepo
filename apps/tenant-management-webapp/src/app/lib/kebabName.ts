import dashify from 'dashify';

export const toKebabName = (value: string): string => {
  return dashify(value);
};

export const replaceSpaceWithDash = (value: string): string => {
  return value.toLowerCase().replace(/ /g, '-');
};
