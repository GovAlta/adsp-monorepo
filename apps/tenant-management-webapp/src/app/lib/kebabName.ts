export const toKebabName = (tenantName: string): string => {
  return tenantName.replace(/ /g, '-');
};
