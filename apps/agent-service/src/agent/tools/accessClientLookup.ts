import z from 'zod';
import {
  AccessDiscoveryProblem,
  clientMatchesText,
  ClientReader,
  createProblem,
  KeycloakClientConfiguration,
  normalizeServiceText,
  toClientSummary,
  toProblemFields,
} from '../agents/access/discovery';
import type { InspectionTarget } from './accessToolSupport';

/**
 * Finds a client by its client ID for every Access tool that inspects one, suggesting similar clients when there is
 * no exact match.
 */

export const MAX_CLIENT_ID_LENGTH = 255;
export const MAX_CLIENT_SUGGESTIONS = 5;

export const clientIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_CLIENT_ID_LENGTH)
  .describe(
    'Client ID exactly as the user gave it, e.g. role-test or urn:ads:platform:tenant-admin-app. Never build a URN ' +
      'or add a suffix.',
  );

export interface FoundClient {
  internalId: string;
  configuration: KeycloakClientConfiguration;
}

export interface ClientLookupFailure {
  problem: AccessDiscoveryProblem;
  suggestions?: string[];
}

export type ClientLookupResult = { ok: true; value: FoundClient } | { ok: false; failure: ClientLookupFailure };

export function toClientFailureFields(target: InspectionTarget, clientId: string, failure: ClientLookupFailure) {
  const { environment, realm } = target;
  return {
    ...toProblemFields(failure.problem),
    environment,
    realm,
    clientId,
    ...(failure.suggestions?.length > 0 ? { suggestions: failure.suggestions } : {}),
  };
}

export function createClientLookup(clientReader: ClientReader) {
  /**
   * Suggests clients whose ID, name or description contains the text. A client ID made up from an app name, such as
   * urn:ads:demo:role-test-app for role-test, is also matched by its short name.
   */
  async function suggestClients(target: InspectionTarget, clientId: string): Promise<ClientLookupFailure> {
    const notFound = createProblem('not-found', 'CLIENT_NOT_FOUND');
    const clients = await clientReader.listAllClients(target.reader);
    if (clients.ok === false) {
      return { problem: clients.problem };
    }

    const searches = [...new Set([clientId, normalizeServiceText(clientId)])].filter((text) => text !== '');
    const similar = searches
      .map((text) => clients.value.filter((client) => clientMatchesText(client, text)))
      .find((matches) => matches.length > 0);
    const suggestions = (similar ?? [])
      .map((client) => toClientSummary(client)?.clientId)
      .filter((suggestion) => !!suggestion && suggestion !== clientId)
      .slice(0, MAX_CLIENT_SUGGESTIONS);
    return { problem: notFound, ...(suggestions.length > 0 ? { suggestions } : {}) };
  }

  /**
   * Finds Keycloak's internal ID of the client, without reading its configuration.
   */
  async function findClient(
    target: InspectionTarget,
    clientId: string,
  ): Promise<{ ok: true; value: string } | { ok: false; failure: ClientLookupFailure }> {
    const internalId = await clientReader.findClientInternalId(target.reader, clientId);
    if (internalId.ok === false) {
      return { ok: false, failure: { problem: internalId.problem } };
    }
    if (!internalId.value) {
      return { ok: false, failure: await suggestClients(target, clientId) };
    }
    return { ok: true, value: internalId.value };
  }

  async function lookupClient(target: InspectionTarget, clientId: string): Promise<ClientLookupResult> {
    const internalId = await findClient(target, clientId);
    if (internalId.ok === false) {
      return internalId;
    }

    const configuration = await clientReader.getClientConfiguration(target.reader, internalId.value);
    if (configuration.ok === false) {
      return { ok: false, failure: { problem: configuration.problem } };
    }
    return { ok: true, value: { internalId: internalId.value, configuration: configuration.value } };
  }

  return { findClient, lookupClient };
}

export type ClientLookup = ReturnType<typeof createClientLookup>;
