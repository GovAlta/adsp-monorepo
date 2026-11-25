const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { join } = require('node:path');

const rulePath = join(__dirname, '..', 'rules', 'event-service.yaml');
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
  // fixture matching; successful local tests do not prove Loki LogQL execution.
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
  {
    name: 'ANSI-colored Error',
    value: JSON.stringify({ message: '\u001b[31merror\u001b[39m: RabbitMQ publish failed.' }),
    error: true,
    critical: false,
  },
  {
    name: 'plain-text Error',
    value: JSON.stringify({ message: 'error: RabbitMQ publish failed.' }),
    error: true,
    critical: false,
  },
  {
    name: 'Critical',
    value: JSON.stringify({ message: '\u001b[91mcritical\u001b[0m: Event processing unavailable.' }),
    error: false,
    critical: true,
  },
  {
    name: 'Alert',
    value: JSON.stringify({ message: 'alert: Event processing unavailable.' }),
    error: false,
    critical: true,
  },
  {
    name: 'Info containing CLIENT_LOGIN_ERROR',
    value: JSON.stringify({
      message: "\u001b[32minfo\u001b[39m: Wrote event 'access-service:CLIENT_LOGIN_ERROR' to log.",
    }),
    error: false,
    critical: false,
  },
  {
    name: 'Info containing LOGOUT_ERROR',
    value: JSON.stringify({ message: 'info: Event access-service:LOGOUT_ERROR sent by user.' }),
    error: false,
    critical: false,
  },
  {
    name: 'Warning containing error text',
    value: JSON.stringify({ message: '\u001b[33mwarn\u001b[39m: Error encountered for event test.' }),
    error: false,
    critical: false,
  },
  {
    name: 'genuine Error containing an ERROR event name',
    value: JSON.stringify({
      message: '\u001b[31merror\u001b[39m: Failed to process access-service:CLIENT_LOGIN_ERROR.',
    }),
    error: true,
    critical: false,
  },
  {
    name: 'collector severity differs from application severity',
    value: JSON.stringify({ level: 'error', message: '\u001b[32minfo\u001b[39m: Informational event.' }),
    error: false,
    critical: false,
  },
  {
    name: 'unexpected leading text',
    value: JSON.stringify({ message: '2026-11-23 error: Failure after leading text.' }),
    error: false,
    critical: false,
  },
  {
    name: 'different ANSI color sequence',
    value: JSON.stringify({ message: '\u001b[1;31merror\u001b[0m: Bold red Error.' }),
    error: true,
    critical: false,
  },
  { name: 'missing message', value: JSON.stringify({ level: 'error' }), error: false, critical: false },
  { name: 'empty message', value: JSON.stringify({ message: '' }), error: false, critical: false },
  { name: 'null message', value: JSON.stringify({ message: null }), error: false, critical: false },
  { name: 'numeric message', value: JSON.stringify({ message: 123 }), error: false, critical: false },
  { name: 'object message', value: JSON.stringify({ message: { level: 'error' } }), error: false, critical: false },
];

for (const fixture of fixtures) {
  test(fixture.name, () => {
    assert.equal(evaluateFixture(fixture.value, errorRegex).matches, fixture.error, 'Error match');
    assert.equal(evaluateFixture(fixture.value, criticalRegex).matches, fixture.critical, 'Critical match');
  });
}

test('malformed JSON is rejected before severity matching', () => {
  assert.deepEqual(evaluateFixture('{"message":', errorRegex), { jsonError: true, matches: false });
  assert.deepEqual(evaluateFixture('{"message":', criticalRegex), { jsonError: true, matches: false });
});

test('expressions preserve the reviewed LogQL pipeline and aggregation', () => {
  for (const alertName of ['ADSPLogCritical', 'ADSPLogError']) {
    const expression = getExpression(alertName);
    assert.match(expression, /sum by \(kubernetes_pod_name, kubernetes_container_name\)/);
    assert.match(expression, /kubernetes_namespace_name="\$\{NAMESPACE\}"/);
    assert.match(expression, /kubernetes_container_name="event-service"/);
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

test('rules preserve routing labels, required annotations and approved runbooks', () => {
  const critical = getRuleBlock('ADSPLogCritical');
  const error = getRuleBlock('ADSPLogError');

  assert.match(critical, /service: event-service/);
  assert.match(critical, /namespace: \$\{NAMESPACE\}/);
  assert.match(critical, /severity: critical/);
  assert.match(error, /service: event-service/);
  assert.match(error, /namespace: \$\{NAMESPACE\}/);
  assert.match(error, /severity: warning/);

  for (const block of [critical, error]) {
    for (const annotation of ['summary', 'description', 'impact', 'first_steps', 'runbook_url']) {
      assert.match(block, new RegExp(`\\n                ${annotation}:`));
    }
  }

  assert.match(
    critical,
    /runbook_url: https:\/\/goa-dio\.atlassian\.net\/wiki\/spaces\/ADSPA\/pages\/5228494940\/Event\+Service\+Critical\+Log\+Alert/,
  );
  assert.match(
    error,
    /runbook_url: https:\/\/goa-dio\.atlassian\.net\/wiki\/spaces\/ADSPA\/pages\/5228429420\/Event\+Service\+Error\+Log\+Alert/,
  );
});
