import axios from 'axios';

interface MetricResult {
  name: string;
  values: {
    interval: string;
    sum: string;
    avg: string;
  }[];
}

export async function getEventMetrics(
  valueApiUrl: URL,
  accessToken: string,
  tenantId: string,
  since: Date,
  metricLike: string
): Promise<MetricResult[]> {
  const { data } = await axios.get<Record<string, MetricResult>>(
    new URL('v1/event-service/values/event/metrics', valueApiUrl).href,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        tenantId,
        interval: 'weekly',
        top: 100,
        criteria: JSON.stringify({ metricLike, intervalMin: since.toISOString() }),
      },
    }
  );

  const { page: _page, ...metrics } = data;
  return Object.entries(metrics).map(([_, result]) => result);
}
