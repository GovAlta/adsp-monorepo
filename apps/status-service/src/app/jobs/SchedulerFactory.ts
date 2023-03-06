import axios from 'axios';
import { Job, scheduleJob } from 'node-schedule';
import { StaticApplicationData } from '../model';
import { createCheckEndpointJob, CreateCheckEndpointProps } from './checkEndpoint';
import { HealthCheckSchedulingProps, JobScheduler } from './JobScheduler';

const JOB_TIME_INTERVAL_MIN = 1;
const REQUEST_TIMEOUT = 5000;

const cronScheduler = (action: () => Promise<void>): Job => scheduleJob(`*/${JOB_TIME_INTERVAL_MIN} * * * *`, action);

export const getScheduler = (
  props: HealthCheckSchedulingProps,
  schedule: (action: () => Promise<void>) => Job = cronScheduler
): JobScheduler => {
  return {
    schedule: (app: StaticApplicationData): Job => {
      const cceProps: CreateCheckEndpointProps = {
        ...props,
        app: app,
        getEndpointResponse: async (url: string) => {
          return await axios.get(url, { timeout: REQUEST_TIMEOUT });
        },
      };
      const action = createCheckEndpointJob(cceProps);
      return schedule(action);
    },
  };
};
