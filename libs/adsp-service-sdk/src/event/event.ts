import { AdspId } from '../utils';

export interface DomainEvent {
  name: string;
  timestamp: Date;
  correlationId?: string;
  tenantId?: AdspId;
  context?: {
    [key: string]: boolean | number | string;
  };
  payload: { [key: string]: unknown };
}

/**
 * Interface to the definition for an event interval metric.
 *
 * The interval definition contains information about the event that represents the start of the interval.
 * It is included on the event definition of the event that represents the end of the interval.
 *
 * @export
 * @interface IntervalDefinition
 */
export interface IntervalDefinition {
  /**
   * Metric name or name elements.
   *
   * This value can include names of context properties to create dynamic metric names.
   *
   * @type {(string | string[])}
   * @memberof IntervalDefinition
   */
  metric: string | string[];
  /**
   * Namespace of the event that represents the start the interval.
   *
   * @type {string}
   * @memberof IntervalDefinition
   */
  namespace: string;
  /**
   * Name of the event that represents the start of the interval.
   *
   * @type {string}
   * @memberof IntervalDefinition
   */
  name: string;
  /**
   *
   *
   * @type {(string[])}
   * @memberof IntervalDefinition
   */
  context?: string[];
}

export interface DomainEventDefinition {
  name: string;
  description: string;
  payloadSchema: Record<string, unknown>;
  interval?: IntervalDefinition;
}
