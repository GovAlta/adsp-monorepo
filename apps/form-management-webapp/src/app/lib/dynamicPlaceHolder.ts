import { EventDefinition } from '@store/event/models';
import jsf from 'json-schema-faker';
import { faker } from '@faker-js/faker/locale/en_CA';

export const dynamicGeneratePayload = (
  tenant: { name: string; realm: string },
  eventDef: EventDefinition,
  managementUrl: string,
  title: string,
  subtitle: string
): Record<string, unknown> => {
  jsf.extend('faker', () => faker);
  jsf.option({
    optionalsProbability: 1,
    maxItems: 3,
    fixedProbabilities: true,
    useDefaultValue: true,
    useExamplesValue: true,
  });
  let payload = {};
  const payloadSchema = eventDef?.payloadSchema;
  if (payloadSchema) {
    payload = jsf.generate(payloadSchema);
  }

  return {
    event: { payload: payload },
    tenant,
    managementUrl,
    title,
    subtitle,
  };
};
