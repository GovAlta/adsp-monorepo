const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { join } = require('node:path');

// These tests exercise expressions extracted from the deployable Form Service rule using local
// JavaScript fixtures. They do not prove collector extraction, Loki RE2 parsing, LogQL execution,
// Ruler evaluation, pending-to-firing transitions or notification delivery.
const rulePath = join(__dirname, '..', 'rules', 'form-service.yaml');
const template = readFileSync(rulePath, 'utf8');

function getRuleBlock(alertName) {
  const startMarker = `            - alert: ${alertName}\n`;
  const start = template.indexOf(startMarker);
  assert.notEqual(start, -1, `${alertName} must exist in ${rulePath}`);

  const nextRule = template.indexOf('\n            - alert:', start + startMarker.length);
  return template.slice(start, nextRule === -1 ? template.length : nextRule);
}

function getExpression(alertName) {
  const block = getRuleBlock(alertName);
  const match = block.match(/\n              expr: \|\n([\s\S]*?)\n              for:/);
  assert.ok(match, `${alertName} must have a literal expression block`);
  return match[1];
}

function getPrefixRegex(alertName) {
  const expression = getExpression(alertName);
  const match = expression.match(/\|~ `([^`]+)`/);
  assert.ok(match, `${alertName} must have a backtick-delimited line-filter regex`);

  // LogQL uses Go RE2's POSIX character class. JavaScript's equivalent is used only for local
  // fixture matching; passing these checks does not validate the expression in Loki.
  return new RegExp(match[1].replaceAll('[[:space:]]', '\\s'));
}

function evaluateFixture(serialized, regex) {
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (_err) {
    return { jsonError: true, matches: false };
  }

  return {
    jsonError: false,
    matches: typeof parsed.message === 'string' && regex.test(parsed.message),
  };
}

const errorRegex = getPrefixRegex('ADSPLogError');
const criticalRegex = getPrefixRegex('ADSPLogCritical');

const fixtures = [
  ['plain Error', { message: 'error: Failed to save form.' }, true, false],
  ['ANSI Error', { message: '\u001b[31merror\u001b[39m: Notification dependency failed.' }, true, false],
  ['plain Critical', { message: 'critical: Form operations unavailable.' }, false, true],
  ['plain Alert', { message: 'alert: Form operations unavailable.' }, false, true],
  ['ANSI Critical', { message: '\u001b[91mcritical\u001b[0m: MongoDB unavailable.' }, false, true],
  ['ANSI Alert', { message: '\u001b[35malert\u001b[39m: Form processing unavailable.' }, false, true],
  ['Info false positive', { message: 'info: Form saved.' }, false, false],
  ['Debug false positive', { message: 'debug: Validating form data.' }, false, false],
  ['Warning false positive', { message: 'warn: Error requesting PDF generation.' }, false, false],
  ['Info containing error prefix text', { message: 'info: Observed error: state from downstream.' }, false, false],
  ['Warning containing critical prefix text', { message: 'warn: Observed critical: dependency state.' }, false, false],
  ['Info containing alert prefix text', { message: 'info: Recorded alert: event.' }, false, false],
  ['collector/application disagreement', { level: 'error', message: 'info: Form saved.' }, false, false],
  ['unexpected leading text', { message: '2026-11-25 error: Failed to save form.' }, false, false],
  ['different ANSI sequence', { message: '\u001b[1;31merror\u001b[0m: Failed to save form.' }, true, false],
  ['unsupported Fatal severity', { message: 'fatal: Form operations unavailable.' }, false, false],
  ['unsupported Emergency severity', { message: 'emergency: Form operations unavailable.' }, false, false],
  ['missing message', { level: 'error' }, false, false],
  ['empty message', { message: '' }, false, false],
  ['null message', { message: null }, false, false],
  ['numeric message', { message: 123 }, false, false],
  ['object message', { message: { level: 'error' } }, false, false],
];

for (const [name, value, error, critical] of fixtures) {
  test(`Form Service: ${name}`, () => {
    const serialized = JSON.stringify(value);
    assert.equal(evaluateFixture(serialized, errorRegex).matches, error, 'Error match');
    assert.equal(evaluateFixture(serialized, criticalRegex).matches, critical, 'Critical match');
  });
}

test('Form Service: malformed JSON is rejected before severity matching', () => {
  assert.deepEqual(evaluateFixture('{"message":', errorRegex), { jsonError: true, matches: false });
  assert.deepEqual(evaluateFixture('{"message":', criticalRegex), { jsonError: true, matches: false });
});

test('Form Service: expressions preserve the candidate pipeline, aggregation and timing', () => {
  for (const alertName of ['ADSPLogCritical', 'ADSPLogError']) {
    const expression = getExpression(alertName);
    assert.match(expression, /sum by \(kubernetes_pod_name, kubernetes_container_name\)/);
    assert.match(expression, /kubernetes_namespace_name="\$\{NAMESPACE\}"/);
    assert.match(expression, /kubernetes_container_name="form-service"/);
    assert.match(expression, /\| json app_message="message"/);
    assert.match(expression, /\| __error__=""/);
    assert.match(expression, /\| line_format "\{\{\.app_message\}\}"/);
    assert.match(expression, /\) > 0/);
    assert.doesNotMatch(expression, /\|\s*level(?:=|=~)/);
  }

  assert.match(getExpression('ADSPLogCritical'), /\[1m\]/);
  assert.doesNotMatch(getExpression('ADSPLogCritical'), /fatal|emergency/i);
  assert.match(getExpression('ADSPLogError'), /\[3m\]/);
  assert.match(getRuleBlock('ADSPLogCritical'), /\n              for: 0s\n/);
  assert.match(getRuleBlock('ADSPLogError'), /\n              for: 30s\n/);
});

test('Form Service: namespace substitution covers DEV, UAT and PROD', () => {
  for (const namespace of ['adsp-dev', 'adsp-uat', 'adsp-prod']) {
    const rendered = template.replaceAll('${NAMESPACE}', namespace);
    assert.match(rendered, new RegExp(`namespace: ${namespace}`));
    assert.match(rendered, new RegExp(`kubernetes_namespace_name="${namespace}"`));
    assert.doesNotMatch(rendered, /\$\{NAMESPACE\}/);
  }
});

test('Form Service: rule preserves routing labels, annotations and existing runbooks', () => {
  const critical = getRuleBlock('ADSPLogCritical');
  const error = getRuleBlock('ADSPLogError');

  assert.match(template, /metadata:\n  name: form-service-log-alerts/);
  assert.match(template, /- name: form-service-log-alerts\n          interval: 30s/);
  assert.match(template, /tenantID: application/);
  assert.match(critical, /service: form-service/);
  assert.match(critical, /namespace: \$\{NAMESPACE\}/);
  assert.match(critical, /severity: critical/);
  assert.match(error, /service: form-service/);
  assert.match(error, /namespace: \$\{NAMESPACE\}/);
  assert.match(error, /severity: warning/);

  for (const block of [critical, error]) {
    for (const annotation of ['summary', 'description', 'impact', 'first_steps', 'runbook_url']) {
      assert.match(block, new RegExp(`\\n                ${annotation}:`));
    }
  }

  assert.match(
    critical,
    /runbook_url: https:\/\/goa-dio\.atlassian\.net\/wiki\/spaces\/ADSPA\/pages\/5226857671/
  );
  assert.match(
    error,
    /runbook_url: https:\/\/goa-dio\.atlassian\.net\/wiki\/spaces\/ADSPA\/pages\/5226857650/
  );
});
