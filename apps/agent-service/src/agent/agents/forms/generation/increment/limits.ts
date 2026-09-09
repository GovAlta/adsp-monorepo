import { countControlElements } from '../../schema/counts';

export const MAX_INCREMENT_CONTROLS = 25;
export const MAX_INCREMENT_PROPERTIES = 25;
export const MAX_INCREMENT_JSON_BYTES = 100 * 1024;

export type IncrementFailedArtifact =
  | 'property_collision'
  | 'duplicate_scope'
  | 'scaffold_rejected'
  | 'invalid_increment'
  | 'branch_trigger_in_payload';

export interface IncrementSizeInput {
  dataSchemaProperties?: Record<string, unknown>;
  uiElements?: unknown[];
  required?: unknown[];
  conditionalRequired?: unknown[];
}

function measureIncrementSize(input: IncrementSizeInput): {
  controlCount: number;
  propertyCount: number;
  jsonBytes: number;
} {
  const uiElements = input.uiElements ?? [];
  const jsonBytes = Buffer.byteLength(
    JSON.stringify({
      dataSchemaProperties: input.dataSchemaProperties,
      uiElements: input.uiElements,
      required: input.required,
      conditionalRequired: input.conditionalRequired,
    }),
    'utf8',
  );

  return {
    controlCount: uiElements.reduce<number>((total, element) => total + countControlElements(element), 0),
    propertyCount: Object.keys(input.dataSchemaProperties ?? {}).length,
    jsonBytes,
  };
}

export function incrementTooLargeReason(input: IncrementSizeInput): string | null {
  const { controlCount, propertyCount, jsonBytes } = measureIncrementSize(input);
  if (controlCount > MAX_INCREMENT_CONTROLS) {
    return `Increment has ${controlCount} Control elements; the cap is ${MAX_INCREMENT_CONTROLS}.`;
  }
  if (propertyCount > MAX_INCREMENT_PROPERTIES) {
    return `Increment has ${propertyCount} dataSchemaProperties keys; the cap is ${MAX_INCREMENT_PROPERTIES}.`;
  }
  if (jsonBytes > MAX_INCREMENT_JSON_BYTES) {
    return `Increment JSON is ${jsonBytes} bytes; the cap is ${MAX_INCREMENT_JSON_BYTES}.`;
  }
  return null;
}
