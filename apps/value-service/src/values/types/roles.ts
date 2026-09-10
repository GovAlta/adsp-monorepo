export enum ServiceUserRoles {
  Writer = 'value-writer',
  Reader = 'value-reader',
  // clean-code-ignore: RULE-19 — enum value only, no logic; usage is covered in router/value.spec.ts.
  PlatformMetricsReader = 'value-platform-metrics-reader',
}

export enum ExportServiceRoles {
  ExportJob = 'urn:ads:platform:export-service:export-job',
}
