package ca.ab.gov.alberta.adsp.sdk.socket;

import ca.ab.gov.alberta.adsp.sdk.events.FullDomainEvent;

interface TestListener {
  void onEvent(FullDomainEvent<TestPayload> event);
}
