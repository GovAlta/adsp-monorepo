const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { test } = require('node:test');
const { join } = require('node:path');

// These tests exercise expressions in a non-deployable proposal using local JavaScript fixtures.
// They do not prove collector extraction, Loki RE2 parsing, LogQL execution, Ruler evaluation or
// notification. Runtime validation and published runbooks are required before promotion to rules/.
const proposalPath = join(__dirname, '..', 'proposals', 'tenant-management-api.yaml');
const rulePath = join(__dirname, '..', 'rules', 'tenant-management-api.yaml');
const template = readFileSync(proposalPath, 'utf8');

function getRuleBlock(alertName) {
  const startMarker = `            - alert: ${alertName}\n`;
  const start = template.indexOf(startMarker);
  assert.notEqual(start, -1, `${alertName} must exist in ${proposalPath}`);

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
  ['plain Error', { message: 'error: Failed to provision tenant.' }, true, false],
  ['ANSI Error', { message: '\u001b[31merror\u001b[39m: Failed to connect to a dependency.' }, true, false],
  ['plain Critical', { message: 'critical: Tenant resolution unavailable.' }, false, true],
  ['plain Alert', { message: 'alert: Tenant lifecycle processing unavailable.' }, false, true],
  ['ANSI Critical', { message: '\u001b[91mcritical\u001b[0m: Tenant resolution unavailable.' }, false, true],
  ['ANSI Alert', { message: '\u001b[35malert\u001b[39m: Tenant lifecycle processing unavailable.' }, false, true],
  ['Info false positive', { message: 'info: Provisioned tenant successfully.' }, false, false],
  ['Debug false positive', { message: 'debug: Validating tenant name.' }, false, false],
  ['Warning false positive', { message: 'warn: Unexpected error encountered in handler (status: 500).' }, false, false],
  ['Info containing error text', { message: 'info: Recorded provisioning_error event.' }, false, false],
  ['Info containing critical prefix text', { message: 'info: Observed critical: dependency state.' }, false, false],
  ['Warning containing alert prefix text', { message: 'warn: Ignoring alert: test notification.' }, false, false],
  ['expected business outcome currently logged as Error', { message: 'error: Failed to get tenant: not found.' }, true, false],
  ['collector/application disagreement', { level: 'error', message: 'info: Tenant lookup completed.' }, false, false],
  ['unexpected leading text', { message: '2026-11-25 error: Realm operation failed.' }, false, false],
  ['different ANSI sequence', { message: '\u001b[1;31merror\u001b[0m: Realm operation failed.' }, true, false],
  ['missing message', { level: 'error' }, false, false],
  ['empty message', { message: '' }, false, false],
  ['null message', { message: null }, false, false],
  ['numeric message', { message: 123 }, false, false],
  ['object message', { message: { level: 'error' } }, false, false],
];

for (const [name, value, error, critical] of fixtures) {
  test(`Tenant Management API: ${name}`, () => {
    const serialized = JSON.stringify(value);
    assert.equal(evaluateFixture(serialized, errorRegex).matches, error, 'Error match');
    assert.equal(evaluateFixture(serialized, criticalRegex).matches, critical, 'Critical match');
  });
}

test('Tenant Management API: malformed JSON is rejected before severity matching', () => {
  assert.deepEqual(evaluateFixture('{"message":', errorRegex), { jsonError: true, matches: false });
  assert.deepEqual(evaluateFixture('{"message":', criticalRegex), { jsonError: true, matches: false });
});

test('Tenant Management API: expressions preserve the candidate pipeline, aggregation and timing', () => {
  for (const alertName of ['ADSPLogCritical', 'ADSPLogError']) {
    const expression = getExpression(alertName);
    assert.match(expression, /sum by \(kubernetes_pod_name, kubernetes_container_name\)/);
    assert.match(expression, /kubernetes_namespace_name="\$\{NAMESPACE\}"/);
    assert.match(expression, /kubernetes_container_name="tenant-management-api"/);
    assert.match(expression, /\| json app_message="message"/);
    assert.match(expression, /\| __error__=""/);
    assert.match(expression, /\| line_format "\{\{\.app_message\}\}"/);
    assert.match(expression, /\) > 0/);
  }

  assert.match(getExpression('ADSPLogCritical'), /\[1m\]/);
  assert.match(getExpression('ADSPLogError'), /\[3m\]/);
  assert.match(getRuleBlock('ADSPLogCritical'), /\n              for: 0s\n/);
  assert.match(getRuleBlock('ADSPLogError'), /\n              for: 30s\n/);
});

test('Tenant Management API: namespace substitution covers DEV, UAT and PROD', () => {
  for (const namespace of ['adsp-dev', 'adsp-uat', 'adsp-prod']) {
    const rendered = template.replaceAll('${NAMESPACE}', namespace);
    assert.match(rendered, new RegExp(`namespace: ${namespace}`));
    assert.match(rendered, new RegExp(`kubernetes_namespace_name="${namespace}"`));
    assert.doesNotMatch(rendered, /\$\{NAMESPACE\}/);
  }
});

test('Tenant Management API: proposal preserves routing labels and required draft annotations', () => {
  const critical = getRuleBlock('ADSPLogCritical');
  const error = getRuleBlock('ADSPLogError');

  assert.match(template, /metadata:\n  name: tenant-management-api-log-alerts/);
  assert.match(template, /- name: tenant-management-api-log-alerts\n          interval: 30s/);
  assert.match(template, /tenantID: application/);
  assert.match(critical, /service: tenant-management-api/);
  assert.match(critical, /namespace: \$\{NAMESPACE\}/);
  assert.match(critical, /severity: critical/);
  assert.match(error, /service: tenant-management-api/);
  assert.match(error, /namespace: \$\{NAMESPACE\}/);
  assert.match(error, /severity: warning/);

  for (const block of [critical, error]) {
    for (const annotation of ['summary', 'description', 'impact', 'first_steps']) {
      assert.match(block, new RegExp(`\\n                ${annotation}:`));
    }
    assert.doesNotMatch(block, /runbook_url:/);
  }
});

test('Tenant Management API: proposal cannot be discovered by the renderer', () => {
  assert.match(proposalPath, /\/proposals\/tenant-management-api\.yaml$/);
  assert.equal(existsSync(rulePath), false);
  assert.doesNotMatch(template, /(?:insert|placeholder|todo|example).*runbook/i);
});
