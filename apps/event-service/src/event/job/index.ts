import { Observable } from 'rxjs';
import { Logger } from 'winston';
import { DomainEventWorkItem, ValueServiceClient } from '@core-services/core-common';
import { createLogEventJob } from './logEvent';

export interface JobProps {
  logger: Logger
  valueService: ValueServiceClient
  events: Observable<DomainEventWorkItem>
}

export const createJobs = ({
  logger,
  valueService,
  events
}: JobProps) => {
  
  const logEventJob = createLogEventJob({ logger, valueService });
  events.subscribe((next) => {
    logEventJob(next.event, next.done);
  })
}
