export const AuditCategories = {
  Administrative: 'administrative',
  Runtime: 'runtime',
  Security: 'security',
  DataAccess: 'data-access',
  Diagnostic: 'diagnostic',
} as const;

export type AuditCategory = (typeof AuditCategories)[keyof typeof AuditCategories];

export const AuditSeverities = {
  Info: 'info',
  Warning: 'warning',
  Critical: 'critical',
} as const;

export type AuditSeverity = (typeof AuditSeverities)[keyof typeof AuditSeverities];

export const BuiltInRetentionClasses = {
  Standard: 'standard',
  Security: 'security',
  Compliance: 'compliance',
} as const;

/** Retention class applied to an action that does not set one, by category. */
export const DefaultCategoryRetentionClasses: Record<AuditCategory, string> = {
  [AuditCategories.Administrative]: BuiltInRetentionClasses.Compliance,
  [AuditCategories.Security]: BuiltInRetentionClasses.Security,
  [AuditCategories.DataAccess]: BuiltInRetentionClasses.Compliance,
  [AuditCategories.Runtime]: BuiltInRetentionClasses.Standard,
  [AuditCategories.Diagnostic]: BuiltInRetentionClasses.Standard,
};

export interface AuditActionDefinition {
  version: number;
  category: AuditCategory;
  severity: AuditSeverity;
  /** Optional; when omitted the class is derived from the category, and when set it overrides the category default. */
  retentionClass?: string;
  description?: string;
  resourceType?: string;
  captureChangeSet?: boolean;
  forwardToSiem?: boolean;
  metadataSchema?: Record<string, unknown>;
}

/** Resolves the retention class of an action: its own class if set, otherwise the default for its category. */
export function resolveRetentionClass({
  retentionClass,
  category,
}: Pick<AuditActionDefinition, 'retentionClass' | 'category'>): string {
  return retentionClass ?? DefaultCategoryRetentionClasses[category] ?? BuiltInRetentionClasses.Standard;
}

export interface AuditAction extends AuditActionDefinition {
  name: string;
}

/** Converts application action constants into a catalog, rejecting duplicate action names. */
export function auditDefinitions(
  actions: Record<string, AuditAction> | AuditAction[],
): Record<string, AuditActionDefinition> {
  const definitions = new Map<string, AuditActionDefinition>();
  for (const { name, ...definition } of Object.values(actions)) {
    if (typeof name !== 'string' || !/^[a-zA-Z0-9]+(?:[._:-][a-zA-Z0-9]+)*$/.test(name)) {
      throw new Error(`Invalid audit action name: ${name}`);
    }
    if (definitions.has(name)) {
      throw new Error(`Duplicate audit action name: ${name}`);
    }
    definitions.set(name, definition);
  }
  return Object.fromEntries(definitions);
}
