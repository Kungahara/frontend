const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports, extra = {}) {
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (name) => imports[name], Response, process, setTimeout: () => {}, ...extra });
  return exports;
}

test('connection failures become a retryable 503', async () => {
  const server = load('src/lib/auth-server.ts', { 'next/headers': {}, 'next/server': {} }, {
    fetch: async () => { throw new TypeError('fetch failed'); },
  });
  const response = await server.backendRequest('auth/me/');
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'service_unavailable');
});

for (const scenario of [
  { name: 'access check outage', access: 'access', statuses: [503], expected: 503, cleared: false },
  { name: 'refresh outage', access: 'access', statuses: [401, 503], expected: 503, cleared: false },
  { name: 'refresh outage with expired access cookie', statuses: [503], expected: 503, cleared: false },
  { name: 'invalid refresh token', statuses: [401], expected: 401, cleared: true },
]) {
  test(scenario.name, async () => {
    let cleared = false;
    const statuses = [...scenario.statuses];
    const route = load('src/app/api/auth/[action]/route.ts', {
      'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
      '@/lib/auth-server': {
        tokenCookies: async () => ({ access: scenario.access, refresh: 'refresh' }),
        backendRequest: async () => Response.json({ error: { message: 'Request failed' } }, { status: statuses.shift() }),
        readJson: (response) => response.json(),
        clearSession: (response) => { cleared = true; return response; },
      },
    });
    const response = await route.GET({}, { params: Promise.resolve({ action: 'me' }) });
    assert.equal(response.status, scenario.expected);
    assert.equal(cleared, scenario.cleared);
  });
}
