import type { ApiServiceSummary } from '../api-specs/apiSpecsRepository';
import { Diagnosis, DIAGNOSIS_RULES, DiagnosisRule, MatchLevel, SymptomSignals } from './diagnoses';

const MAX_DIAGNOSES = 3;
const LEVEL_RANK: Record<MatchLevel, number> = { exact: 3, strong: 2, weak: 1 };
const STATUS_WORDS: [RegExp, number][] = [
  [/(?<![0-9])401(?![0-9])|\bunauthori[sz]ed\b(?!_)/g, 401],
  [/(?<![0-9])403(?![0-9])|\bforbidden\b/g, 403],
];
const URN_PATTERN = /urn:ads:platform:([a-z0-9-]+)/gi;
const OUTBOUND_PATTERN = /\b(calling|calls? to|requests? to|from)\b/;
// "My service" is left out on purpose: a service that got a 401 calling another is the caller, not the endpoint.
const OWN_ENDPOINT_PATTERN =
  /\b(my|our) (own )?(endpoint|api|route)s?\b|\breturns? (a )?40[13] to\b|\bcallers? (get|gets|receive|receives)\b/;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wholeTerm = (term: string, flags = '') =>
  new RegExp(`(?<![a-z0-9_-])${escapeRegExp(term.toLowerCase())}(?![a-z0-9_-])`, flags);

function findTarget(lower: string, services: ApiServiceSummary[]): SymptomSignals['target'] {
  const urnMatch = new RegExp(URN_PATTERN.source, 'i').exec(lower);
  if (urnMatch) {
    const urn = `urn:ads:platform:${urnMatch[1]}`;
    return { urn, app: services.find((service) => service.urn.toLowerCase() === urn)?.app };
  }

  let earliest: { index: number; service: ApiServiceSummary } | undefined;
  for (const service of services) {
    for (const name of [service.app, service.name]) {
      const index = lower.search(wholeTerm(name));
      if (index >= 0 && (!earliest || index < earliest.index)) {
        earliest = { index, service };
      }
    }
  }
  return earliest && { urn: earliest.service.urn, app: earliest.service.app };
}

export function extractSignals(symptom: string, services: ApiServiceSummary[]): SymptomSignals {
  const lower = symptom.toLowerCase();
  const statusCodes = STATUS_WORDS.filter(([pattern]) => new RegExp(pattern.source).test(lower)).map(
    ([, code]) => code,
  );
  const target = findTarget(lower, services);
  return {
    text: symptom,
    statusCodes,
    target,
    outboundContext: !!target || OUTBOUND_PATTERN.test(lower),
    ownEndpoint: OWN_ENDPOINT_PATTERN.test(lower),
  };
}

/** The symptom with URNs and known service names removed, so a name like configuration-service isn't a keyword. */
function keywordText(lower: string, services: ApiServiceSummary[]): string {
  let text = lower.replace(URN_PATTERN, ' ');
  for (const service of services) {
    for (const name of [service.app, service.name]) {
      text = text.replace(wholeTerm(name, 'g'), ' ');
    }
  }
  return text;
}

interface Scored {
  rule: DiagnosisRule;
  index: number;
  level: MatchLevel;
  signals: number;
}

function score(
  rule: DiagnosisRule,
  index: number,
  lower: string,
  keywords: string,
  signals: SymptomSignals,
): Scored | undefined {
  const fragments = rule.messageFragments.filter((fragment) => lower.includes(fragment.toLowerCase())).length;
  const status = rule.statusCodes.some((code) => signals.statusCodes.includes(code));
  const context = signals.outboundContext || signals.ownEndpoint;
  const keywordHits = rule.keywords.filter((keyword) => wholeTerm(keyword).test(keywords)).length;
  const total = fragments + (status ? 1 : 0) + (status && context ? 1 : 0) + keywordHits;

  let level: MatchLevel | undefined;
  if (fragments > 0) {
    level = 'exact';
  } else if ((status && context) || keywordHits >= 2) {
    level = 'strong';
  } else if (status) {
    level = 'weak';
  }
  return level && { rule, index, level, signals: total };
}

export function diagnose(symptom: string, services: ApiServiceSummary[]): Diagnosis[] {
  const lower = symptom.toLowerCase();
  const signals = extractSignals(symptom, services);
  const keywords = keywordText(lower, services);

  return DIAGNOSIS_RULES.map((rule, index) => score(rule, index, lower, keywords, signals))
    .filter((scored): scored is Scored => !!scored)
    .sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || b.signals - a.signals || a.index - b.index)
    .slice(0, MAX_DIAGNOSES)
    .map(({ rule, level }) => ({
      id: rule.id,
      match: level,
      symptom: rule.symptom,
      ...rule.build(signals),
      sources: rule.sources,
    }));
}
