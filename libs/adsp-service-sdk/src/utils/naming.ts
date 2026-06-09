/**
 * Tenant name kebab-case: lowercase + spaces to hyphens. Preserves underscores.
 * @example "CS_PUBLIC" → "cs_public"
 * @deprecated For tenant names only (backward compatibility). Use toKebabCase for new IDs.
 */
export const toKebabName = (tenantName: string): string => {
  return tenantName.toLowerCase().replace(/ /g, '-');
};

/**
 * Strict kebab-case: lowercase alphanumeric + hyphens only. For IDs matching /^[a-z0-9-]+$/.
 * @example "CS_PUBLIC" → "cs-public", "My Form!" → "my-form"
 */
export const toKebabCase = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};
