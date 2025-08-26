export interface MetricsRepository {
  isConnected(): boolean;
  writeMetrics(key: string, metrics: Record<string, unknown>): Promise<boolean>;
  readMetrics(key: string): Promise<Record<string, unknown>>;
}
