const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { test } = require('node:test');
const { join } = require('node:path');

// These tests exercise the expressions in the deployable rule; they are local JavaScript fixture
// checks and do not prove Loki RE2 parsing, LogQL execution, Ruler evaluation or notification.
const rulePath = join(__dirname, '..', 'rules', 'notification-service.yaml');
const proposalPath = join(__dirname, '..', 'proposals', 'notification-service.yaml');
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
  ['plain Error', { message: 'error: Email configuration is not ready.' }, true, false],
  ['ANSI Error', { message: '\u001b[31merror\u001b[39m: Email configuration is not ready.' }, true, false],
  ['plain Critical', { message: 'critical: Notification processing unavailable.' }, false, true],
  ['plain Alert', { message: 'alert: Notification processing unavailable.' }, false, true],
  ['ANSI Critical', { message: '\u001b[91mcritical\u001b[0m: Notification processing unavailable.' }, false, true],
  ['ANSI Alert', { message: '\u001b[35malert\u001b[39m: Notification processing unavailable.' }, false, true],
  ['Info false positive', { message: 'info: Notification generation completed.' }, false, false],
  ['Debug false positive', { message: 'debug: Sending notification work item.' }, false, false],
  ['Warning false positive', { message: 'warn: Provider request will be retried.' }, false, false],
  ['Info containing error word', { message: 'info: Recorded notification_error event.' }, false, false],
  ['Warning containing error text', { message: 'warn: Error encountered sending notification.' }, false, false],
  ['collector/application disagreement', { level: 'error', message: 'info: Notification queued.' }, false, false],
  ['unexpected leading text', { message: '2026-11-25 error: Provider submission failed.' }, false, false],
  ['different ANSI sequence', { message: '\u001b[1;31merror\u001b[0m: Provider submission failed.' }, true, false],
  ['missing message', { level: 'error' }, false, false],
  ['empty message', { message: '' }, false, false],
  ['null message', { message: null }, false, false],
  ['numeric message', { message: 123 }, false, false],
  ['object message', { message: { level: 'error' } }, false, false],
];

for (const [name, value, error, critical] of fixtures) {
  test(`Notification Service: ${name}`, () => {
    const serialized = JSON.stringify(value);
    assert.equal(evaluateFixture(serialized, errorRegex).matches, error, 'Error match');
    assert.equal(evaluateFixture(serialized, criticalRegex).matches, critical, 'Critical match');
  });
}

test('Notification Service: malformed JSON is rejected before severity matching', () => {
  assert.deepEqual(evaluateFixture('{"message":', errorRegex), { jsonError: true, matches: false });
  assert.deepEqual(evaluateFixture('{"message":', criticalRegex), { jsonError: true, matches: false });
});

test('Notification Service: expressions preserve the reviewed pipeline, aggregation and timing', () => {
  for (const alertName of ['ADSPLogCritical', 'ADSPLogError']) {
    const expression = getExpression(alertName);
    assert.match(expression, /sum by \(kubernetes_pod_name, kubernetes_container_name\)/);
    assert.match(expression, /kubernetes_namespace_name="\$\{NAMESPACE\}"/);
    assert.match(expression, /kubernetes_container_name="notification-service"/);
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

test('Notification Service: namespace substitution preserves namespace and query selectors', () => {
  for (const namespace of ['adsp-dev', 'adsp-uat', 'adsp-prod']) {
    const rendered = template.replaceAll('${NAMESPACE}', namespace);
    assert.match(rendered, new RegExp(`namespace: ${namespace}`));
    assert.match(rendered, new RegExp(`kubernetes_namespace_name="${namespace}"`));
    assert.doesNotMatch(rendered, /\$\{NAMESPACE\}/);
  }
});

test('Notification Service: deployable rule preserves routing labels and actionable annotations', () => {
  const critical = getRuleBlock('ADSPLogCritical');
  const error = getRuleBlock('ADSPLogError');

  assert.match(template, /metadata:\n  name: notification-service-log-alerts/);
  assert.match(template, /- name: notification-service-log-alerts\n          interval: 30s/);
  assert.match(template, /tenantID: application/);
  assert.match(critical, /service: notification-service/);
  assert.match(critical, /namespace: \$\{NAMESPACE\}/);
  assert.match(critical, /severity: critical/);
  assert.match(error, /service: notification-service/);
  assert.match(error, /namespace: \$\{NAMESPACE\}/);
  assert.match(error, /severity: warning/);

  for (const block of [critical, error]) {
    for (const annotation of ['summary', 'description', 'impact', 'first_steps', 'runbook_url']) {
      assert.match(block, new RegExp(`\\n                ${annotation}:`));
    }
  }

  assert.match(
    critical,
    /runbook_url: https:\/\/goa-dio\.atlassian\.net\/wiki\/spaces\/ADSPA\/pages\/5230428220/,
  );
  assert.match(
    error,
    /runbook_url: https:\/\/goa-dio\.atlassian\.net\/wiki\/spaces\/ADSPA\/pages\/5230198905/,
  );
});

test('Notification Service: rule is deployable and no proposal copy exists', () => {
  assert.match(rulePath, /\/rules\/notification-service\.yaml$/);
  assert.equal(existsSync(proposalPath), false);

  const runbookUrls = [...template.matchAll(/^\s+runbook_url:\s+(\S+)$/gm)].map((match) => match[1]);
  assert.deepEqual(runbookUrls, [
    'https://goa-dio.atlassian.net/wiki/spaces/ADSPA/pages/5230428220',
    'https://goa-dio.atlassian.net/wiki/spaces/ADSPA/pages/5230198905',
  ]);
});
