import { EventDefinition } from '@store/event/models';
import { JSONSchemaFaker } from 'json-schema-faker';
import { faker } from '@faker-js/faker/locale/en_CA';

export const dynamicGeneratePayload = (
  tenant: { name: string; realm: string },
  eventDef: EventDefinition,
  managementUrl: string,
  title: string,
  subtitle: string,
): Record<string, unknown> => {
  JSONSchemaFaker.extend('faker', () => faker);
  JSONSchemaFaker.option({
    optionalsProbability: 1,
    maxItems: 3,
    fixedProbabilities: true,
    useDefaultValue: true,
    useExamplesValue: true,
  });
  let payload = null;
  const payloadSchema = eventDef?.payloadSchema;
  if (payloadSchema) {
    payload = JSONSchemaFaker.generate(payloadSchema);
  }

  return {
    event: { payload: payload },
    tenant,
    managementUrl,
    title,
    subtitle,
  };
};
