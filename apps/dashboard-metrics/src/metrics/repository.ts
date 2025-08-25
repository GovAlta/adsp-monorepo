export interface MetricsRepository {
  writeMetrics(key: string, metrics: Record<string, unknown>): Promise<boolean>;
  readMetrics(key: string): Promise<Record<string, unknown>>;
}
