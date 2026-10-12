import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { getPkceExchangeOptions } from '../src/lib/auth-utils.ts';

test('um segundo pedido de recuperação não troca o verificador do primeiro link identificado', async () => {
  // All provider calls are mocked: no email, user account or real token is used.
  const cookies = new Map();
  const recoverRequests = [];
  const exchangeRequests = [];
  const client = createServerClient('https://auth-tests.example', 'sb_publishable_example_test_key', {
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: entries => entries.forEach(({ name, value, options }) => {
        if (options.maxAge === 0) cookies.delete(name);
        else cookies.set(name, value);
      }),
    },
    global: {
      fetch: async (input, init) => {
        const url = String(input);
        const body = JSON.parse(init.body);
        if (url.includes('/recover')) {
          recoverRequests.push(body);
          return Response.json({});
        }
        if (url.includes('/token?grant_type=pkce')) {
          exchangeRequests.push(body);
          return Response.json({ code: 'bad_code_verifier', msg: 'Mocked token response' }, { status: 400 });
        }
        throw new Error('Unexpected provider call in mock.');
      },
    },
  });
  await client.auth.initialize();
  assert.equal((await client.auth.resetPasswordForEmail('first@example.com')).error, null);
  const firstSlot = [...cookies.keys()].find(name => /-flow-.*-code-verifier$/.test(name));
  assert.ok(firstSlot, 'O cookie do primeiro pedido deve ser persistido antes do retorno da API.');
  const flowId = firstSlot.match(/-flow-([A-Za-z0-9_-]+)-code-verifier$/)[1];
  assert.equal((await client.auth.resetPasswordForEmail('second@example.com')).error, null);
  assert.notEqual(recoverRequests[0].code_challenge, recoverRequests[1].code_challenge);

  await client.auth.exchangeCodeForSession('mock-first-code', getPkceExchangeOptions(flowId));
  assert.equal(exchangeRequests.length, 1);
  const challenge = createHash('sha256').update(exchangeRequests[0].code_verifier).digest('base64url');
  assert.equal(challenge, recoverRequests[0].code_challenge);
  assert.notEqual(challenge, recoverRequests[1].code_challenge);

  await client.auth.exchangeCodeForSession('mock-invalid-flow', getPkceExchangeOptions(''));
  assert.equal(exchangeRequests.length, 1, 'ID inválido deve falhar antes de consumir qualquer código no provedor.');
});
