import { createServerClient } from '@supabase/ssr';
import { spawn } from 'node:child_process';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
}

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const email = `authenticated-dashboard-${runId}@example.test`;
const password = `Auth-dashboard-${Date.now()}-Aa1!`;
const port = 3100;
const appUrl = `http://127.0.0.1:${port}`;

function assert(condition, message, detail) {
  if (!condition) throw new Error(`${message}\n${JSON.stringify(detail ?? null, null, 2)}`);
}

async function request(path, { method = 'GET', token, apikey = anonKey, body, headers = {} } = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: {
      apikey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  return { response, data };
}

async function waitForApp(child) {
  const deadline = Date.now() + 60_000;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Next.js exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(`${appUrl}/login`, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error(`Next.js did not become ready: ${lastError?.message ?? 'timeout'}`);
}

let result = await request('/auth/v1/admin/users', {
  method: 'POST',
  token: serviceKey,
  apikey: serviceKey,
  body: { email, password, email_confirm: true },
});
assert(result.response.ok, 'create authenticated dashboard user failed', result.data);

result = await request('/auth/v1/token?grant_type=password', {
  method: 'POST',
  body: { email, password },
});
assert(result.response.ok && result.data?.access_token && result.data?.refresh_token, 'authenticated sign-in failed', result.data);
const accessToken = result.data.access_token;
const refreshToken = result.data.refresh_token;

result = await request('/rest/v1/rpc/create_workspace', {
  method: 'POST',
  token: accessToken,
  body: { p_name: `Authenticated Dashboard ${runId}` },
});
assert(result.response.ok && typeof result.data === 'string', 'workspace creation failed', result.data);
const workspaceId = result.data;

result = await request(`/rest/v1/workspaces?id=eq.${workspaceId}&select=id,slug,name`, {
  token: accessToken,
});
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 1, 'workspace lookup failed', result.data);
const workspace = result.data[0];
assert(workspace.slug, 'workspace slug missing', workspace);

const cookieMap = new Map();
const supabase = createServerClient(supabaseUrl, anonKey, {
  cookies: {
    getAll() {
      return Array.from(cookieMap, ([name, value]) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      for (const { name, value } of cookiesToSet) cookieMap.set(name, value);
    },
  },
});

const { error: sessionError } = await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken,
});
assert(!sessionError, 'failed to construct Supabase SSR session', sessionError);
assert(cookieMap.size > 0, 'Supabase SSR session produced no cookies');

const cookieHeader = Array.from(cookieMap, ([name, value]) => `${name}=${value}`).join('; ');

const child = spawn('npm', ['run', 'dev', '--', '-p', String(port)], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    PORT: String(port),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let appLog = '';
child.stdout.on('data', (chunk) => { appLog += chunk.toString(); });
child.stderr.on('data', (chunk) => { appLog += chunk.toString(); });

try {
  await waitForApp(child);

  const root = await fetch(`${appUrl}/`, {
    headers: { Cookie: cookieHeader },
    redirect: 'manual',
  });
  assert([302, 303, 307, 308].includes(root.status), 'authenticated root did not redirect', {
    status: root.status,
    location: root.headers.get('location'),
  });
  const location = root.headers.get('location') ?? '';
  assert(location.includes(`/${workspace.slug}/home`), 'authenticated root did not redirect to workspace home', {
    status: root.status,
    location,
    workspace,
  });
  assert(!location.includes('/login'), 'authenticated root incorrectly redirected to login', { location });

  const dashboard = await fetch(`${appUrl}/${workspace.slug}/home`, {
    headers: { Cookie: cookieHeader },
    redirect: 'manual',
  });
  const html = await dashboard.text();
  assert(dashboard.status === 200, 'authenticated dashboard did not render HTTP 200', {
    status: dashboard.status,
    location: dashboard.headers.get('location'),
    body: html.slice(0, 500),
  });
  assert(html.includes('CEO AI Thailand'), 'dashboard brand marker missing');
  assert(html.includes('Marketing OS'), 'dashboard product marker missing');
  assert(html.includes('Workspace data connected'), 'workspace-connected marker missing');
  assert(!html.includes('เข้าสู่ระบบ</h1>'), 'dashboard rendered login page instead of authenticated state');

  console.log(JSON.stringify({
    gate: 'AUTHENTICATED_DASHBOARD_SSR',
    status: 'PASS',
    path: 'local Supabase user -> password auth -> SSR cookies -> middleware -> workspace redirect -> protected dashboard render',
    workspaceId,
    workspaceSlug: workspace.slug,
    rootStatus: root.status,
    dashboardStatus: dashboard.status,
    productionTouched: false,
  }, null, 2));
} catch (error) {
  console.error(appLog.slice(-8000));
  throw error;
} finally {
  child.kill('SIGTERM');
}
