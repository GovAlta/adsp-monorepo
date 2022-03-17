export const toKebabName = (tenantName: string): string => {
  return tenantName.toLowerCase().replace(/ /g, '-');
};
