import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// This check never creates accounts, sends recovery messages or changes passwords.
const envFile = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
const env = Object.fromEntries(envFile.split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1)];
}));
const origin = new URL(env.APP_URL).origin;
const settings = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
  headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
  signal: AbortSignal.timeout(15000),
});
assert.equal(settings.status, 200, 'A chave pública deve ser aceita pelo projeto Supabase.');
const authSettings = await settings.json();
assert.equal(authSettings.external?.email, true, 'Login por e-mail deve estar habilitado.');
console.log('PASS: projeto Supabase acessível, chave pública aceita e login por e-mail habilitado.');
console.log(`Cadastro público no Supabase: ${authSettings.disable_signup ? 'desabilitado' : 'habilitado (desabilitar no painel para acesso controlado pela empresa)'}.`);

const loginPage = await fetch(origin, { signal: AbortSignal.timeout(15000) });
assert.equal(loginPage.status, 200);
assert.match(await loginPage.text(), /login-logo-space/);
console.log('PASS: tela de login disponível.');

for (const path of ['/inicio', '/redefinir-senha']) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 307, `${path} deve bloquear visitantes sem sessão.`);
  assert.equal(new URL(response.headers.get('location'), origin).pathname, '/');
  assert.match(response.headers.get('cache-control') || '', /no-store/);
  console.log(`PASS: ${path} bloqueia acesso sem sessão e não permite cache.`);
}

async function post(path, body, requestOrigin = origin) {
  return fetch(`${origin}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: requestOrigin },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
}
const foreign = await post('login', {}, 'https://outro-site.example');
assert.equal(foreign.status, 403);
assert.match(foreign.headers.get('cache-control') || '', /no-store/);
console.log('PASS: solicitações de outra origem são recusadas.');

assert.equal((await post('login', { email: {}, password: [], remember: false })).status, 400);
console.log('PASS: entradas inválidas são recusadas no servidor.');

const invalidLogin = await post('login', {
  email: `verificacao-${randomUUID()}@example.invalid`,
  password: randomUUID(),
  remember: false,
}, 'http://localhost:3000');
assert.equal(invalidLogin.status, 401, 'Uma conta inexistente não pode entrar.');
assert.equal(invalidLogin.headers.get('set-cookie'), null, 'Login recusado não deve emitir sessão.');
console.log('PASS: Supabase recusa credenciais fictícias e a aplicação não concede sessão.');
console.log('PASS: localhost é aceito no desenvolvimento sem bloquear o login por origem.');

assert.equal((await post('password', { password: randomUUID() })).status, 401);
console.log('PASS: redefinição de senha exige sessão de recuperação.');

const callback = await fetch(`${origin}/auth/callback?code=`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
assert.equal(callback.status, 307);
assert.equal(new URL(callback.headers.get('location')).searchParams.get('recuperacao'), 'expirada');
console.log('PASS: link inválido de recuperação retorna ao login.');

const wrongBrowser = await fetch(`${origin}/auth/callback?code=ficticio&sb_flow_id=`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
assert.equal(wrongBrowser.status, 307);
assert.equal(new URL(wrongBrowser.headers.get('location')).searchParams.get('recuperacao'), 'navegador');
assert.match(wrongBrowser.headers.get('referrer-policy') || '', /no-referrer/);
console.log('PASS: callback sem verificador informa o navegador incorreto sem conceder sessão.');
