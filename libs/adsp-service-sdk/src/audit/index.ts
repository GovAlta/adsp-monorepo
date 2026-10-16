export interface AuditActionDefinition {
  version: number;
  category: 'administrative' | 'runtime' | 'security' | 'data-access';
  severity: 'info' | 'warning' | 'critical';
  retentionClass: string;
  description?: string;
  resourceType?: string;
  captureChangeSet?: boolean;
  forwardToSiem?: boolean;
  metadataSchema?: Record<string, unknown>;
}

export interface AuditAction extends AuditActionDefinition {
  name: string;
}

/** Converts application action constants into a catalog, rejecting duplicate action names. */
export function auditDefinitions(actions: Record<string, AuditAction>): Record<string, AuditActionDefinition> {
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
