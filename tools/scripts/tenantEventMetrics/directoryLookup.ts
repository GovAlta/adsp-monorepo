import axios from 'axios';

let entries: Record<string, URL> = undefined;
export async function directoryLookup(directoryUrl: URL, serviceOrApiUrn: string): Promise<URL> {
  if (!entries) {
    const { data } = await axios.get<{ urn: string; url: string }[]>(
      new URL('/directory/v2/namespaces/platform/entries', directoryUrl).href
    );

    entries = data.reduce((entries, { urn, url }) => ({ ...entries, [urn]: new URL(url) }), {});
  }

  return entries[serviceOrApiUrn];
}
