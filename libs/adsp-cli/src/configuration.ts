import { HttpRequestError } from './httpError';

/**
 * Generic, reusable configuration-service read. Explicit params on purpose — not opinionated
 * about environment resolution, so any future live-config-reading tool can call it directly.
 */
export async function getConfiguration<C = unknown>(
  accessToken: string,
  configurationServiceUrl: string,
  namespace: string,
  name: string
): Promise<C> {
  const url = new URL(`/configuration/v2/configuration/${namespace}/${name}/latest`, configurationServiceUrl);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new HttpRequestError(response.status, `Configuration service request failed with status ${response.status}.`);
  }

  return (await response.json()) as C;
}
