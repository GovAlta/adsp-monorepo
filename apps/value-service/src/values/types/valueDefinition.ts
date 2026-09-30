export interface ValueDefinition {
  name: string;
  description: string;
  type?: string; // clean-code-ignore: RULE-19 — type-only change; no runtime code to test.
  jsonSchema: Record<string, unknown>;
  sendWriteEvent?: boolean;
}
