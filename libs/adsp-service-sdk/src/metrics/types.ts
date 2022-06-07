export const REQ_BENCHMARK = 'req_benchmark';

export interface RequestBenchmark {
  timings: Record<string, [number, number]>;
  metrics: Record<string, number>;
}
