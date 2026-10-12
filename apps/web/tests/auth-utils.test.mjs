import test from 'node:test';
import assert from 'node:assert/strict';
import { getRecoveryRateLimit, getRecoveryNotice, isAllowedAuthOrigin, isPublishableKey, isSameOrigin, sessionCookieOptions, validateEmail, REMEMBER_SECONDS } from '../src/lib/auth-utils.ts';

test('a cota de envio usa uma espera maior que o intervalo entre pedidos e falhas de rede não acionam bloqueio', () => {
  const quota = getRecoveryRateLimit({ status: 429, code: 'over_email_send_rate_limit' });
  const burst = getRecoveryRateLimit({ status: 429, code: 'over_request_rate_limit' });
  assert.ok(quota.retryAfterSeconds > burst.retryAfterSeconds);
  assert.match(quota.message, /limite de envio/);
  assert.match(burst.message, /pouco tempo/);
  assert.equal(getRecoveryRateLimit({ status: 503 }), null);
});

test('recuperação distingue link expirado, navegador diferente e indisponibilidade', () => {
  assert.match(getRecoveryNotice('expirada'), /mais recente/);
  assert.match(getRecoveryNotice('navegador'), /mesmo navegador/);
  assert.match(getRecoveryNotice('indisponivel'), /Tente novamente/);
});

test('cookies de sessão não se tornam persistentes durante a renovação', () => {
  const options = sessionCookieOptions({ maxAge: 400 * 86400, expires: new Date('2030-01-01') }, false, false);
  assert.equal(options.maxAge, undefined);
  assert.equal(options.expires, undefined);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
});

test('manter conectado persiste por 30 dias e usa HTTPS em produção', () => {
  const options = sessionCookieOptions({}, true, true);
  assert.equal(options.maxAge, REMEMBER_SECONDS);
  assert.equal(options.secure, true);
});

test('a saída preserva a expiração imediata, mesmo com manter conectado', () => {
  assert.equal(sessionCookieOptions({ maxAge: 0 }, true, true).maxAge, 0);
});

test('somente a origem exata do sistema pode enviar solicitações de autenticação', () => {
  const origin = 'http://127.0.0.1:3000';
  assert.equal(isSameOrigin(origin, origin), true);
  assert.equal(isSameOrigin(null, origin), false);
  assert.equal(isSameOrigin('https://outro-site.example', origin), false);
  assert.equal(isSameOrigin('http://127.0.0.1:3000.outro-site.example', origin), false);
});

test('localhost e 127.0.0.1 são aceitos na mesma porta somente em desenvolvimento', () => {
  const expected = 'http://127.0.0.1:3000';
  assert.equal(isAllowedAuthOrigin('http://localhost:3000', expected, true), true);
  assert.equal(isAllowedAuthOrigin(expected, 'http://localhost:3000', true), true);
  assert.equal(isAllowedAuthOrigin('http://localhost:3000', expected, false), false);
  assert.equal(isAllowedAuthOrigin('http://localhost:3001', expected, true), false);
  assert.equal(isAllowedAuthOrigin('https://localhost:3000', expected, true), false);
  assert.equal(isAllowedAuthOrigin('http://localhost:3000.outro-site.example', expected, true), false);
  assert.equal(isAllowedAuthOrigin('http://localhost:3000/extra', expected, true), false);
  assert.equal(isAllowedAuthOrigin(null, expected, true), false);
  assert.equal(isAllowedAuthOrigin('http://localhost:3000', 'https://empresa.example', true), false);
});

test('a validação de e-mail rejeita objetos, campos vazios e valores malformados', () => {
  assert.equal(validateEmail({ email: 'user@example.com' }), null);
  assert.equal(validateEmail(''), null);
  assert.equal(validateEmail('usuario@'), null);
  assert.equal(validateEmail('a'.repeat(255) + '@example.com'), null);
  assert.equal(validateEmail(' user@example.com '), 'user@example.com');
});

test('chaves privilegiadas são rejeitadas e chaves públicas são aceitas', () => {
  assert.equal(isPublishableKey('sb_secret_not_a_public_key'), false);
  assert.equal(isPublishableKey('sb_publishable_example_public_key'), true);
  const jwt = role => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.test`;
  assert.equal(isPublishableKey(jwt('anon')), true);
  assert.equal(isPublishableKey(jwt('service_role')), false);
});
