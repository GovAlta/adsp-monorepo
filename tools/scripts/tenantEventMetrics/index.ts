import * as chalk from 'chalk';
import { DateTime, Duration } from 'luxon';
import * as parser from 'yargs-parser';
import { getAccessToken } from './getAccessToken';
import { getTenants } from './getTenants';
import { directoryLookup } from './directoryLookup';
import { getEventMetrics } from './getEventMetrics';

async function getTenantEventMetrics(
  accessServiceUrl: URL,
  directoryUrl: URL,
  clientSecret: string,
  clientId: string,
  eventLike: string,
  since: Date
) {
  const tenantApiUrl = await directoryLookup(directoryUrl, 'urn:ads:platform:tenant-service:v2');
  let accessToken = await getAccessToken(accessServiceUrl, clientId, clientSecret);
  const tenants = await getTenants(tenantApiUrl, accessToken);

  const valueApiUrl = await directoryLookup(directoryUrl, 'urn:ads:platform:value-service:v1');
  for (const tenant of tenants) {
    console.log(chalk`{green ${tenant.name}} (ID: ${tenant.id}) since {green ${since}}`);
    accessToken = await getAccessToken(accessServiceUrl, clientId, clientSecret);
    const metrics = await getEventMetrics(valueApiUrl, accessToken, tenant.id, since, eventLike);
    for (const { name, values } of metrics) {
      const isDuration = name.endsWith('duration');
      console.log(chalk`Metric: {green ${name}}`);
      let sum = 0;
      for (const value of values) {
        console.log(chalk`{blue ${value.interval}}: ${isDuration ? parseFloat(value.avg).toFixed(1) : value.sum}`);
        if (!isDuration) {
          sum += parseInt(value.sum);
        }
      }
      if (!isDuration) {
        console.log(chalk`{blue Interval total}: ${sum}`);
      }
    }
  }
}

const { accessServiceUrl, directoryUrl, clientSecret, clientId, eventLike, since } = parser(process.argv.slice(2), {
  alias: {
    accessServiceUrl: 'a',
    directoryUrl: 'd',
    eventLike: 'l',
  },
  default: {
    since: DateTime.now().minus(Duration.fromISO('P1M')).toISO(),
  },
});

if (!accessServiceUrl || !directoryUrl || !clientSecret || !clientId) {
  console.log(`node tenantEventMetrics.js -a <access service URL> -d <directory URL> --clientId <client ID> --clientSecret <client secret>

Options:
  -a, --accessServiceUrl  URL to access service
  -d, --directoryUrl      URL to directory of services
      --clientId          Client ID of service account in core realm to use
      --clientSecret      Client secret to use with Client ID as client credentials
  -l, --eventLike         Criteria for metrics to retrieve (e.g. -l pdf-service)
      --since             Minimum date-time for the interval in which to retrieves metrics; defaults to 1 month before now
  `);
} else {
  getTenantEventMetrics(
    new URL(accessServiceUrl),
    new URL(directoryUrl),
    clientSecret,
    clientId,
    eventLike,
    new Date(since)
  ).then(() => {
    console.log('done');
  });
}
